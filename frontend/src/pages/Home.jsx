import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut, Video } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';

function Home() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    const generateMeetingCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateMeeting = async () => {
        const newCode = generateMeetingCode();
        await addToUserHistory(newCode);
        navigate(`/${newCode}`);
    };


    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return alert("Please enter a meeting code");
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
            
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Meetify Logo" className="h-10 w-auto" />
                        <span className="text-2xl hidden md:flex font-bold text-white">Meetify</span>
                    </div>
                </motion.div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate("/history")}
                        className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition font-medium"
                    >
                        <Clock size={20} />
                        History
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-red-500/90 transition font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-20 grid md:grid-cols-2 gap-16 items-center">
                
                {/* Left Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                        Start or Join
                        <span className="block text-indigo-400">
                            A Video Meeting
                        </span>
                    </h1>

                    <p className="mt-6 text-slate-300 max-w-lg">
                        Enter a meeting code to instantly connect. Fast, secure,
                        and crystal-clear video calls powered by Meetify.
                    </p>

                    {/* Join Card */}
                    <div className="mt-10 bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input 
                                type="text"
                                placeholder="Enter meeting code"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className="flex-1 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            <button 
                                onClick={handleJoinVideoCall}
                                className="px-8 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-semibold shadow-lg active:scale-95"
                            >
                                Create Room
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Right Panel */} 
                <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.4 }} 
                className="relative hidden md:flex justify-center" 
                > 
                    <div className="absolute -inset-4 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div> 
                    <img src="/logo3.png" alt="Collaboration Illustration" className="relative w-full rounded-4xl max-w-md drop-shadow-2xl" /> 
                </motion.div>

            </main>

            
        </div>
    );
}

export default withAuth(Home);
