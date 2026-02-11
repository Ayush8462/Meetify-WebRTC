import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Hash, VideoOff, Search, Loader2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    // Filtered meetings based on search input
    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => 
            m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [meetings, searchQuery]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-slate-900">
            <div className="max-w-6xl mx-auto">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/home")}
                            className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            <ChevronLeft size={22} />
                        </motion.button>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Meeting History</h1>
                            <p className="text-slate-500 text-sm font-medium">Review and rejoin your past sessions</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Content Logic */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                        <p className="text-slate-500 font-medium">Fetching your history...</p>
                    </div>
                ) : filteredMeetings.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200"
                    >
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <VideoOff size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">No meetings found</h3>
                        <p className="text-slate-500">Try a different search or start a new call.</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filteredMeetings.map((meeting, index) => (
                                <motion.div
                                    layout
                                    key={meeting._id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                    whileHover={{ y: -6, transition: { delay: 0 } }}
                                    className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] transition-all"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                            <Hash size={20} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Session
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">
                                        {meeting.meetingCode}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <Calendar size={15} />
                                        <span>{formatDate(meeting.date)}</span>
                                    </div>

                                    <button 
                                        onClick={() => navigate(`/${meeting.meetingCode}`)}
                                        className="mt-6 w-full py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.98]"
                                    >
                                        Rejoin Room
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}