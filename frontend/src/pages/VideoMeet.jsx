import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { motion, AnimatePresence } from 'framer-motion';
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(3);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])

    useEffect(() => { getPermissions(); })

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!videoPermission);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!audioPermission);

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) localVideoref.current.srcObject = userMediaStream;
                }
            }
        } catch (error) { console.log(error); }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) getUserMedia();
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) {}

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        }
    }

    let getDislayMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) {}

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            getUserMedia()
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            })
                        })
                    }
                })
            }

            if (signal.ice) connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
        }
    }

    let connectToSocketServer = () => {
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
                        if (event.candidate != null) socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream) connections[socketListId].addStream(window.localStream)
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        connections[id2].addStream(window.localStream)
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription })))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio)
    useEffect(() => { if (screen !== undefined) getDislayMedia(); }, [screen])
    let handleScreen = () => setScreen(!screen);

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) {}
        window.location.href = "/"
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages((prevNewMessages) => prevNewMessages + 1);
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    return (
        <div className="h-screen w-full bg-gray-950 relative flex flex-col overflow-hidden text-white">

            {/* JOIN SCREEN */}
            {askForUsername ? (
                <div className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">

                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-30"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="z-10 bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md"
                    >
                        <h1 className="text-3xl font-bold mb-6 text-center">Join Meeting</h1>

                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-6 border border-gray-700 shadow-inner">
                            <video ref={localVideoref} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                        </div>

                        <div className="space-y-4">
                            <TextField
                                fullWidth
                                label="Enter your name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined"
                            />

                            <Button onClick={connect} className="w-full! bg-blue-600! hover:bg-blue-500! py-3! rounded-xl!">
                                Join Room
                            </Button>
                        </div>
                    </motion.div>
                </div>
            ) : (

                <>
                    {/* VIDEO GRID */}
                    <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">

                        <motion.div layout className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg aspect-video">
                            <video ref={localVideoref} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                                You
                            </div>
                        </motion.div>

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

                    {/* CONTROL BAR */}
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="h-20 flex items-center justify-center space-x-4 pb-4">
                        <div className="bg-gray-800/80 backdrop-blur-lg px-6 py-3 rounded-2xl flex items-center space-x-4 border border-gray-700 shadow-2xl">

                            <IconButton onClick={handleAudio} style={{ color: "white" }}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>

                            <IconButton onClick={handleVideo} style={{ color: "white" }}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            {screenAvailable && (
                                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                    {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                                </IconButton>
                            )}

                            <div className="w-px h-8 bg-gray-600 mx-2"></div>

                            <Badge badgeContent={newMessages} color='primary'>
                                <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>

                            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                                <CallEndIcon />
                            </IconButton>
                        </div>
                    </motion.div>

                    {/* CHAT DRAWER */}
                    <AnimatePresence>
                        {showModal && (
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute right-0 top-0 h-full w-full sm:w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl z-50 flex flex-col"
                            >
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                    <h2 className="font-bold text-lg">Chat</h2>
                                    <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">✕</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-10">No messages yet</div>
                                    ) : (
                                        messages.map((m, i) => (
                                            <div key={i} className="bg-gray-700 px-3 py-2 rounded-lg text-sm">
                                                <p className="text-xs text-gray-400 font-bold">{m.sender}</p>
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
                                    <button onClick={sendMessage} className="p-2 bg-blue-600 rounded-full">Send</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    )
}