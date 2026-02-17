import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from "react";
import DehazeIcon from '@mui/icons-material/Dehaze';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 py-6 max-w-7xl mx-auto relative">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Meetify Logo" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-white">Meetify</span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          
          {/* Join as Guest (ALWAYS visible)
          <Link to={"/random"} className="hover:text-indigo-400 font-medium">
            Join as Guest
          </Link> */}

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center">
            <Link to={"/auth"} className="px-5 py-2 mr-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium">
              Register
            </Link>

            <Link to={"/auth"} className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium">
              Login
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <DehazeIcon />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="absolute top-20 right-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-lg p-6 flex flex-col gap-4 md:hidden z-50 w-44">
            
            <Link
              to={"/auth"}
              onClick={() => setMenuOpen(false)}
              className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium text-center"
            >
              Register
            </Link>

            <Link
              to={"/auth"}
              onClick={() => setMenuOpen(false)}
              className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium text-center"
            >
              Login
            </Link>
          </div>
        )}
      </nav>
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold leading-tight">
            Crystal‑clear video calls.
            <span className="block text-indigo-400">Anywhere. Anytime.</span>
          </h2>
          <p className="mt-6 text-slate-300 max-w-xl">
            Meetify lets you connect instantly with high‑quality video, zero lag,
            and enterprise‑grade security — all in a beautifully simple interface.
          </p>
          <div className="mt-10 flex gap-4">
            <Link type="button" className="px-6 py-3 rounded-xl bg-indigo-500 hover:scale-105 transition font-medium"
            to={"/auth"}
            >
              Get Started
            </Link>
          </div>
        </motion.div>
        

        {/* Mock Video Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mb-10"
        >
          <div className="rounded-2xl bg-slate-900/70 border border-slate-700 shadow-2xl p-6">
            <div className="aspect-video rounded-xl bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
              <img src="/image.png" alt="video preview" className="h-76 w-135"/>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Live Call</span>
              <span className="text-sm text-emerald-400">● Connected</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-22 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Meetify. All rights reserved.
      </footer>
    </div>
  );
}
