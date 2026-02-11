import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut, Video } from 'lucide-react'; // Using Lucide for cleaner icons
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';

function Home() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Video className="text-white" size={24} />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-indigo-900">Meetify</h2>
                </motion.div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate("/history")}
                        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
                    >
                        <Clock size={20} />
                        <span>History</span>
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
                
                {/* Left Panel */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
                        Providing Quality <span className="text-indigo-600">Video Calls</span> Just Like Education.
                    </h1>
                    <p className="text-lg text-slate-500 max-w-md">
                        Connect with your team, students, or friends instantly. High-quality video meetings made simple and accessible.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                            type="text"
                            placeholder="Enter meeting code"
                            onChange={(e) => setMeetingCode(e.target.value)}
                            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
                        />
                        <button 
                            onClick={handleJoinVideoCall}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                            Join Call
                        </button>
                    </div>
                </motion.div>

                {/* Right Panel */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative flex justify-center"
                >
                    <div className="absolute -inset-4 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <img 
                        src="/logo3.png" 
                        alt="Collaboration Illustration" 
                        className="relative w-full max-w-md drop-shadow-2xl"
                    />
                </motion.div>

            </main>
        </div>
    );
}

export default withAuth(Home);