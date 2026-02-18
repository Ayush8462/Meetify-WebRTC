import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { motion, AnimatePresence } from 'framer-motion';
import server from '../environment';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MonitorUp,
  MonitorX,
  MessageCircle,
  Send,
  X
} from 'lucide-react';

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState();
  const [showModal, setModal] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState();
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    getPermissions();
  }, [])

  useEffect(() => {
    if (showModal) setNewMessages(0);
  }, [showModal]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPermission);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      if (videoPermission || audioPermission) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        window.localStream = userMediaStream;
        if (localVideoref.current) localVideoref.current.srcObject = userMediaStream;
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) getUserMedia();
  }, [video, audio])

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e))
    }
  }

  const getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {}

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => socketRef.current.emit(
            'signal',
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          ))
      })
    }
  }

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })
    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id

      socketRef.current.on('chat-message', addMessage)

      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id))
      })

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null)
              socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }))
          }

          connections[socketListId].onaddstream = (event) => {
            const stream = event.stream;
            const videoTrack = stream.getVideoTracks()[0];

            let newVideo = {
              socketId: socketListId,
              stream: stream,
              isScreen: videoTrack.label.toLowerCase().includes("screen")
            };

            // if this stream is screen share → make it full screen
            if (newVideo.isScreen) {
              setActiveScreen(newVideo);
            } else {
              setVideos(videos => [
                ...videos.filter(v => v.socketId !== socketListId),
                newVideo
              ]);
            }
          };

          if (window.localStream)
            connections[socketListId].addStream(window.localStream)
        })
      })
    })
  }

  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  'signal',
                  fromId,
                  JSON.stringify({ sdp: connections[fromId].localDescription })
                )
              })
            })
          }
        })
      }

      if (signal.ice)
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
    }
  }

  const handleVideo = async () => {
    if (!window.localStream) return;

    let videoTrack = window.localStream
      .getTracks()
      .find(track => track.kind === "video");

    // if track exists → just toggle
    if (videoTrack) {
      if (videoTrack.readyState === "live") {
        videoTrack.enabled = !videoTrack.enabled;
        setVideo(videoTrack.enabled);
        return;
      }
    }

    // if track was stopped → get new camera stream
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = newStream.getVideoTracks()[0];

      window.localStream.addTrack(newVideoTrack);
      localVideoref.current.srcObject = window.localStream;

      setVideo(true);
    } catch (err) {
      console.log("Camera permission denied", err);
    }
  };


  const handleAudio = async () => {
    if (!window.localStream) return;

    let audioTrack = window.localStream
      .getTracks()
      .find(track => track.kind === "audio");

    // if track exists and is live → toggle
    if (audioTrack) {
      if (audioTrack.readyState === "live") {
        audioTrack.enabled = !audioTrack.enabled;
        setAudio(audioTrack.enabled);
        return;
      }
    }

    // if track stopped → request mic again
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newAudioTrack = newStream.getAudioTracks()[0];

      window.localStream.addTrack(newAudioTrack);

      setAudio(true);
    } catch (err) {
      console.log("Mic permission denied", err);
    }
  };


  const handleScreen = async () => {
    if (!window.localStream) return;

    // START SCREEN SHARE
    if (!screen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // replace video track for all peers
        for (let id in connections) {
          const sender = connections[id]
            .getSenders()
            .find(s => s.track && s.track.kind === "video");

          if (sender) sender.replaceTrack(screenTrack);
        }

        // show screen locally
        localVideoref.current.srcObject = screenStream;

        setScreen(true);

        // when user stops sharing from browser
        screenTrack.onended = async () => {
          await restoreCameraTrack();
        };

      } catch (err) {
        console.log("Screen share error", err);
      }

      return;
    }

    // STOP SCREEN SHARE manually
    await restoreCameraTrack();
  };

  const restoreCameraTrack = async () => {
    try {
      let videoTrack = window.localStream?.getVideoTracks()[0];

      // if camera track missing or stopped → request new one
      if (!videoTrack || videoTrack.readyState !== "live") {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoTrack = newStream.getVideoTracks()[0];
        window.localStream.addTrack(videoTrack);
      }

      // replace screen track back to camera for all peers
      for (let id in connections) {
        const sender = connections[id]
          .getSenders()
          .find(s => s.track && s.track.kind === "video");

        if (sender) sender.replaceTrack(videoTrack);
      }

      // show camera locally again
      localVideoref.current.srcObject = window.localStream;

      setScreen(false);

    } catch (err) {
      console.log("Error restoring camera", err);
    }
  };



  const handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    } catch (e) {}
    window.location.href = "/"
  }

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
    if (socketIdSender !== socketIdRef.current)
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
  };

  const sendMessage = () => {
    socketRef.current.emit('chat-message', message, username)
    setMessage("");
  }

  const connect = () => {
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  }

  return (
    <div className="h-screen w-full bg-linear-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col">

      {askForUsername ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl p-8">
            <h1 className="text-3xl font-semibold text-center mb-6">Join Meeting</h1>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 mb-6">
              <video
                ref={localVideoref}
                autoPlay
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <button
              onClick={connect}
              className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-3 font-medium"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT CONTENT */}
            <div className="flex-1 flex flex-col relative overflow-hidden">

              {/* VIDEO GRID */}
              <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                <AnimatePresence>
                  {videos.map((v) => (
                    <motion.div
                      key={v.socketId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                      className="relative bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-lg aspect-video"
                    >
                      <video
                        ref={el => { if (el) el.srcObject = v.stream }}
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* FLOATING SELF VIDEO */}
              <div className="absolute bottom-28 right-6 w-64 md:w-72 lg:w-80 aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl z-50">
                <video
                  ref={localVideoref}
                  autoPlay
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-full text-xs">
                  You
                </div>
              </div>

              {/* CONTROLS */}
              <div className="h-24 flex items-center justify-center">
                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl">

                  <button onClick={handleAudio} className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700">
                    {audio ? <Mic size={20}/> : <MicOff size={20}/>}
                  </button>

                  <button onClick={handleVideo} className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700">
                    {video ? <Video size={20}/> : <VideoOff size={20}/>}
                  </button>

                  {screenAvailable && (
                    <button onClick={handleScreen} className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700">
                      {screen ? <MonitorUp size={20}/> : <MonitorX size={20}/>}
                    </button>
                  )}

                  <div className="w-px h-8 bg-gray-700"></div>

                  <button onClick={() => setModal(!showModal)} className="relative p-3 rounded-xl bg-gray-800 hover:bg-gray-700">
                    <MessageCircle size={20}/>
                    {newMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                        {newMessages}
                      </span>
                    )}
                  </button>

                  <button onClick={handleEndCall} className="p-3 rounded-xl bg-red-600 hover:bg-red-500">
                    <PhoneOff size={20}/>
                  </button>

                </div>
              </div>
            </div>

            {/* RIGHT CHAT PANEL */}
            <AnimatePresence>
              {showModal && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 320 }}
                  exit={{ width: 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className="h-full bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="font-semibold">Chat</h2>
                    <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                      <X size={18}/>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-10">No messages yet</div>
                    ) : (
                      messages.map((m, i) => (
                        <div key={i} className="bg-gray-800 px-3 py-2 rounded-lg text-sm">
                          <p className="text-xs text-gray-400 font-semibold">{m.sender}</p>
                          {m.data}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-800 flex items-center gap-2">
                    <input
                      className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none"
                      placeholder="Type a message..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <button onClick={sendMessage} className="p-2 bg-blue-600 rounded-full hover:bg-blue-500">
                      <Send size={16}/>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </>
      )}
    </div>
  )
}
