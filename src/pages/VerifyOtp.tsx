import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ShieldCheck, Mail, Key, Clock, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If user comes from register or login page
  const initialEmail = location.state?.email || "";
  const initialOtpExpiresAt = location.state?.otpExpiresAt || null;
  const [email, setEmail] = useState(initialEmail);

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(initialOtpExpiresAt); // Backend expiry timestamp
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch OTP remaining time from backend
  const fetchOtpRemainingTime = async (userEmail: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/otp-remaining-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.remainingTime !== undefined && data.otpExpiresAt) {
          setTimeLeft(data.remainingTime);
          setOtpExpiresAt(data.otpExpiresAt);
          return true;
        }
      }
    } catch (error) {
      console.error("Error fetching OTP remaining time:", error);
    }
    return false;
  };

  // Calculate remaining time from expiry timestamp
  const calculateRemainingTime = (expiresAt: number): number => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    return remaining;
  };

  // Sync timer with backend expiry timestamp on component mount
  useEffect(() => {
    if (email) {
      // If we have expiry timestamp from location state, use it
      if (initialOtpExpiresAt) {
        const remaining = calculateRemainingTime(initialOtpExpiresAt);
        setTimeLeft(remaining);
        setOtpExpiresAt(initialOtpExpiresAt);
      } else {
        // Otherwise, try to fetch remaining time from backend
        fetchOtpRemainingTime(email);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Timer countdown - sync with backend expiry timestamp
  useEffect(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (timeLeft <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      if (otpExpiresAt) {
        // Calculate remaining time from backend timestamp (more accurate)
        const remaining = calculateRemainingTime(otpExpiresAt);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
        }
      } else {
        // Fallback to countdown if no backend timestamp
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timeLeft, otpExpiresAt]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- VERIFY OTP ---
  const handleVerify = async () => {
    if (!email || !otp) {
      setMessage("Please fill all fields.");
      return;
    }

    if (timeLeft <= 0) {
      setMessage("OTP expired. Please resend new OTP.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("OTP verified successfully!");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMessage(data.message || "Verification failed.");
        
        // Sync timer with backend if remaining time is returned
        if (data.remainingTime !== undefined) {
          setTimeLeft(data.remainingTime);
          // If OTP expired, clear the expiry timestamp
          if (data.remainingTime <= 0) {
            setOtpExpiresAt(null);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessage("Error verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND OTP ---
  const handleResend = async () => {
    if (!email) {
      setMessage("Enter email to resend OTP.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      setMessage(data.message);
      if (res.ok && data.otpExpiresAt) {
        // Sync timer with backend expiry timestamp
        const remaining = calculateRemainingTime(data.otpExpiresAt);
        setTimeLeft(remaining);
        setOtpExpiresAt(data.otpExpiresAt);
      } else if (res.ok) {
        // Fallback if backend doesn't return timestamp
        setTimeLeft(120);
        setOtpExpiresAt(null);
      }
    } catch {
      setMessage("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-300 text-sm">
            Enter the OTP sent to your email address
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Timer Display */}
          <div className="mb-6">
            <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${
              timeLeft > 30 
                ? "bg-green-500/20 border border-green-500/50" 
                : timeLeft > 10
                ? "bg-yellow-500/20 border border-yellow-500/50"
                : "bg-red-500/20 border border-red-500/50"
            }`}>
              <Clock className={`w-5 h-5 ${
                timeLeft > 30 
                  ? "text-green-400" 
                  : timeLeft > 10
                  ? "text-yellow-400"
                  : "text-red-400"
              }`} />
              <span className={`text-sm font-semibold ${
                timeLeft > 30 
                  ? "text-green-300" 
                  : timeLeft > 10
                  ? "text-yellow-300"
                  : "text-red-300"
              }`}>
                {timeLeft > 0 ? `Expires in: ${formatTime(timeLeft)}` : "OTP Expired"}
              </span>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* OTP Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Key size={20} />
              </div>
              <input
                type="text"
                placeholder="Enter 5-digit OTP"
                maxLength={5}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all
                           text-center text-2xl tracking-[0.5em] font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                required
                autoFocus
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || timeLeft <= 0 || !otp || otp.length !== 5}
              className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r 
                         from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/50 
                         hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>

            {/* Resend OTP Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || timeLeft > 0}
              className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 
                         border border-white/20 text-white transition-all disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>

            {/* Back to Login Link */}
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>

            {/* Feedback Messages */}
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                message.toLowerCase().includes("success") || message.toLowerCase().includes("verified")
                  ? "bg-green-500/20 border border-green-500/50 text-green-300"
                  : "bg-red-500/20 border border-red-500/50 text-red-300"
              }`}>
                {message.toLowerCase().includes("success") || message.toLowerCase().includes("verified") ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Info Text */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Didn't receive the code? Check your spam folder or click "Resend OTP"
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
