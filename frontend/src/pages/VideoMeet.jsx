import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Send, MonitorUp, Users, X 
} from "lucide-react";

// --- Configuration ---
const SERVER_URL = server;

const PEER_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

// --- Helper Components ---

const Button = ({ children, onClick, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    secondary: "bg-gray-700/50 hover:bg-gray-600/50 text-white backdrop-blur-md",
    active: "bg-white text-gray-900"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-full flex items-center justify-center transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// --- Main Component ---

export default function VideoMeet() {
  // Refs
  const socketRef = useRef();
  const localStreamRef = useRef();
  const connectionsRef = useRef({});
  const localVideoRef = useRef();
  
  // State
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  // Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // --- 1. Initialization ---
  
  useEffect(() => {
    getPermissions();
    // Cleanup on unmount
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error getting media:", err);
      // Handle permission denied gracefully (maybe show a toast)
    }
  };

  // --- 2. Connection Logic ---

  const joinRoom = () => {
    if (!username.trim()) return;
    setJoined(true);
    
    socketRef.current = io.connect(SERVER_URL, { secure: false });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
    });

    socketRef.current.on("signal", handleSignal);
    
    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((clientId) => {
        if (clientId !== socketRef.current.id && !connectionsRef.current[clientId]) {
          initiateConnection(clientId);
        }
      });
    });

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
        setVideos(prev => prev.filter(v => v.socketId !== id));
      }
    });

    socketRef.current.on("chat-message", (msg, sender, senderId) => {
      setMessages(prev => [...prev, { sender, msg, isMe: senderId === socketRef.current.id }]);
      if (senderId !== socketRef.current.id && !showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    });
  };

  const initiateConnection = (partnerId) => {
    const peer = new RTCPeerConnection(PEER_CONFIG);
    connectionsRef.current[partnerId] = peer;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("signal", partnerId, JSON.stringify({ ice: event.candidate }));
      }
    };

    peer.ontrack = (event) => {
      setVideos(prev => {
        if (prev.some(v => v.socketId === partnerId)) return prev;
        return [...prev, { socketId: partnerId, stream: event.streams[0] }];
      });
    };

    peer.createOffer()
      .then(desc => {
        peer.setLocalDescription(desc);
        socketRef.current.emit("signal", partnerId, JSON.stringify({ sdp: peer.localDescription }));
      })
      .catch(err => console.error(err));
  };

  const handleSignal = (fromId, message) => {
    const signal = JSON.parse(message);
    let peer = connectionsRef.current[fromId];

    if (!peer) {
      peer = new RTCPeerConnection(PEER_CONFIG);
      connectionsRef.current[fromId] = peer;
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("signal", fromId, JSON.stringify({ ice: event.candidate }));
        }
      };

      peer.ontrack = (event) => {
        setVideos(prev => {
          if (prev.some(v => v.socketId === fromId)) return prev;
          return [...prev, { socketId: fromId, stream: event.streams[0] }];
        });
      };
    }

    if (signal.sdp) {
      peer.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        if (signal.sdp.type === "offer") {
          peer.createAnswer().then(desc => {
            peer.setLocalDescription(desc);
            socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: peer.localDescription }));
          });
        }
      });
    }

    if (signal.ice) {
      peer.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.error);
    }
  };

  // --- 3. Media Controls ---

  const toggleMic = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => toggleScreenShare(); // Handle browser "Stop Sharing" button

        // Replace track locally
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        // Replace track for peers
        Object.values(connectionsRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        setIsScreenSharing(true);
        setIsVideoOn(true); // Usually screen share implies video is active
      } catch (err) {
        console.error("Cancelled screen share");
      }
    } else {
      // Revert to camera
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = camStream.getVideoTracks()[0];
      
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      
      Object.values(connectionsRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });

      setIsScreenSharing(false);
    }
  };

  const endCall = () => {
    window.location.reload();
  };

  // --- 4. Chat Logic ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    socketRef.current.emit("chat-message", messageInput, username);
    setMessageInput("");
  };

  // --- RENDER ---

  if (!joined) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="z-10 bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md"
        >
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Join Meeting</h1>
          
          <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-6 border border-gray-700 shadow-inner group">
             <video 
               ref={localVideoRef} 
               autoPlay 
               muted 
               className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
             />
             {!isVideoOn && (
               <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                 <VideoOff size={48} />
               </div>
             )}
             
             {/* Quick Controls on Preview */}
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button onClick={toggleMic} className={`p-2 rounded-full ${isMicOn ? 'bg-gray-700' : 'bg-red-500'} text-white transition`}>
                    {isMicOn ? <Mic size={18}/> : <MicOff size={18}/>}
                </button>
                <button onClick={toggleVideo} className={`p-2 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-500'} text-white transition`}>
                    {isVideoOn ? <Video size={18}/> : <VideoOff size={18}/>}
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <Button onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-500">
              Join Room
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-950 relative flex flex-col overflow-hidden">
      
      {/* --- Main Video Grid --- */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {/* Local Video */}
        <motion.div 
          layout 
          className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg aspect-video"
        >
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
            You {isScreenSharing && "(Presenting)"}
          </div>
        </motion.div>

        {/* Remote Videos */}
        <AnimatePresence>
          {videos.map((v) => (
            <motion.div
              key={v.socketId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
              className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg aspect-video"
            >
              <video
                ref={el => { if(el) el.srcObject = v.stream }}
                autoPlay
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- Bottom Control Bar --- */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="h-20 flex items-center justify-center space-x-4 pb-4"
      >
        <div className="bg-gray-800/80 backdrop-blur-lg px-6 py-3 rounded-2xl flex items-center space-x-4 border border-gray-700 shadow-2xl">
            <Button onClick={toggleMic} variant={isMicOn ? "secondary" : "danger"}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>
            
            <Button onClick={toggleVideo} variant={isVideoOn ? "secondary" : "danger"}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            <Button onClick={toggleScreenShare} variant={isScreenSharing ? "active" : "secondary"}>
                <MonitorUp size={20} className={isScreenSharing ? "text-blue-600" : ""} />
            </Button>

            <div className="w-px h-8 bg-gray-600 mx-2"></div>

            <Button onClick={() => { setShowChat(!showChat); setUnreadMessages(0); }} variant={showChat ? "active" : "secondary"} className="relative">
                <MessageSquare size={20} className={showChat ? "text-blue-600" : ""} />
                {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadMessages}
                    </span>
                )}
            </Button>

            <Button onClick={endCall} variant="danger" className="px-6">
                <PhoneOff size={20} />
            </Button>
        </div>
      </motion.div>

      {/* --- Chat Slide-over --- */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full sm:w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-white font-bold text-lg flex items-center"><MessageSquare className="mr-2" size={18}/> Chat</h2>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">No messages yet</div>
                ) : (
                    messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                {!m.isMe && <p className="text-[10px] text-gray-400 font-bold mb-1">{m.sender}</p>}
                                {m.msg}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex items-center gap-2">
                <input 
                    className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                />
                <button type="submit" className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition">
                    <Send size={16} />
                </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}