import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import w3liquor from "../assets/w3liquor.png";

const BackgroundAnimation = () => (
  <div className="absolute inset-0">
    <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
  </div>
);

const SparklesAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${3 + Math.random() * 2}s`,
        }}
      >
        <Sparkles className="w-4 h-4 text-white/20" />
      </div>
    ))}
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
          ? "Invalid email or password"
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/10";
  const iconClass =
    "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400";

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 flex items-center justify-center">
      <BackgroundAnimation />
      <SparklesAnimation />

      <div className="relative z-10 w-full max-w-md p-6">
        <form
          onSubmit={handleLogin}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 hover:bg-white/15 transition-all duration-500"
        >
          <div className="text-center mb-8">
            <div className="inline-block p-0 rounded-2xl mb-4">
              {/* Ganti ikon Lock dengan logo */}
              <img
                src={w3liquor}
                alt="W3Liquor Logo"
                className="w-24 h-24 object-contain mx-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Sales W3Liquor
            </h2>
            <p className="text-gray-300">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="mb-4 relative">
            <Mail className={iconClass} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className={inputClass}
              aria-label="Email address"
            />
          </div>

          <div className="mb-4 relative">
            <Lock className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className={inputClass}
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl mb-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6 text-sm">
          &copy; {new Date().getFullYear()} SecureApp. All rights reserved.
        </p>
      </div>
    </div>
  );
}
