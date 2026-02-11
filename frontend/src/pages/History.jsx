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
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white px-6 md:px-12 py-10">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/home")}
                            className="p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-indigo-600 transition"
                        >
                            <ChevronLeft size={22} />
                        </motion.button>

                        <div>
                            <h1 className="text-3xl font-extrabold">Meeting History</h1>
                            <p className="text-slate-400 text-sm">
                                Review and rejoin your past sessions
                            </p>
                        </div>
                    </div>
                    

                    {/* Search */}
                    <div className="relative group">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search meeting code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl w-full md:w-72 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="animate-spin text-indigo-400 mb-4" size={40} />
                        <p className="text-slate-400 font-medium">Fetching your history...</p>
                    </div>
                ) : filteredMeetings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-28 bg-slate-900/70 border border-slate-700 rounded-3xl"
                    >
                        <div className="p-4 bg-slate-800 rounded-full mb-4">
                            <VideoOff size={48} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold">No meetings found</h3>
                        <p className="text-slate-400">
                            Try a different search or start a new call.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredMeetings.map((meeting, index) => (
                                <motion.div
                                    layout
                                    key={meeting._id || index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.04 }}
                                    whileHover={{ y: -6 }}
                                    className="group bg-slate-900/70 border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-indigo-500 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                            <Hash size={20} />
                                        </div>
                                        <span className="text-xs font-bold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                                            Session
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">
                                        {meeting.meetingCode}
                                    </h3>

                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Calendar size={15} />
                                        <span>{formatDate(meeting.date)}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/${meeting.meetingCode}`)}
                                        className="mt-6 w-full py-3 text-sm font-semibold bg-slate-800 border border-slate-700 rounded-xl hover:bg-indigo-500 hover:border-indigo-500 transition"
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
