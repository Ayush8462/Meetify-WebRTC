import { motion, AnimatePresence } from "framer-motion";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const { handleLogin, handleRegister } = useContext(AuthContext);

  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  try {
    await handleLogin(username, password);
    setMessage("Login successful");
    setUsername("");
    setPassword("");
  } catch (err) {
    setError(
      err?.response?.data?.messag || "Login failed. Please try again."
    );
  }
};

const handleSignupSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  try {
    const message = await handleRegister(name, username, password);
    setMessage(message || "Account created successfully");
    setIsSignup(false);
    setUsername("");
    setPassword("");
    setName("");
  } catch (err) {
    setError(
      err?.response?.data?.message || "Signup failed. Please try again."
    );
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white px-6">
      <motion.div
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl bg-slate-900/70 border border-slate-700 shadow-2xl p-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 layout className="text-3xl font-bold">
            {isSignup ? "Create an account" : "Welcome back"}
          </motion.h1>
          <p className="text-slate-400 mt-2">
            {isSignup
              ? "Sign up to start using Meetify"
              : "Sign in to continue to Meetify"}
          </p>
        </div>

        {/* Error / Message */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-3 rounded-xl">
            {message}
          </div>
        )}

        {/* Animated Form */}
        <AnimatePresence mode="wait">
          {!isSignup ? (
            <motion.form
              key="login"
              onSubmit={handleLoginSubmit}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="John_123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="accent-indigo-500" />
                  Remember me
                </label>
                <button type="button" className="text-indigo-400 hover:underline">
                  Forgot password?
                </button>
              </div> */}

              <button
                type="submit"
                className="w-full mt-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
              >
                Sign In
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              onSubmit={handleSignupSubmit}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="John_123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
              >
                Create Account
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Divider */}
        {/* <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-sm">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div> */}

        {/* Social Auth */}
        {/* <div className="space-y-3">
          <button className="w-full py-3 rounded-xl border border-slate-700 hover:border-slate-500 transition">
            Continue with Google
          </button>
        </div> */}

        {/* Toggle */}
        <p className="mt-8 text-center text-sm text-slate-400">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setMessages("");
            }}
            className="text-indigo-400 hover:underline"
          >
            {isSignup ? "Sign In" : "Create one"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
