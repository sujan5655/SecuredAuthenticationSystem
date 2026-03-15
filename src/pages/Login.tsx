import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight } from "lucide-react";
import { ToastContext } from "../context/ToastContext";
import RecaptchaWidget from "../components/RecaptchaWidget";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(false);

  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loginAsAdmin, setLoginAsAdmin] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);

  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setTimeout(() => setFade(true), 200);
  }, []);

  // Clear locked state when user changes email (they might be trying a different account)
  useEffect(() => {
    if (accountLocked && form.email) setAccountLocked(false);
  }, [form.email]);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch(`${API_BASE}/captcha`, {
        credentials: "include",
      });

      if (res.ok) {
        const blob = await res.blob();
        setCaptchaUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getOrCreateDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = "web-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
      localStorage.setItem("deviceId", id);
    }
    return id;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        deviceId: getOrCreateDeviceId(),
        recaptchaToken: recaptchaToken || undefined,
        captchaToken: requireCaptcha ? captchaInput : undefined,
      };

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (loginAsAdmin && data.role !== "admin") {
          const msg = "Access denied. Administrator account required. Use default login for user accounts.";
          setError(msg);
          toast?.error(msg);
          setLoading(false);
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role || "user");
        localStorage.setItem("userEmail", data.user?.email || form.email);
        localStorage.setItem("userName", data.user?.name || "");
        if (data.sessionId) localStorage.setItem("sessionId", data.sessionId);
        toast?.success("Successfully logged in!");
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (data.accountLocked) {
        setAccountLocked(true);
        const msg = data.message || "Account locked. Use Forgot Password to unlock.";
        setError(msg);
        toast?.error(msg);
        setLoading(false);
        return;
      }

      if (data.message.includes("OTP")) {
        navigate("/verify-otp");
        return;
      }

      if (data.requireCaptcha) {
        setRequireCaptcha(true);
        fetchCaptcha();
        setCaptchaInput("");
        setRecaptchaToken("");
        setRecaptchaKey((k) => k + 1);
        setError(data.message);
        toast?.error(data.message);
        return;
      }

      setRecaptchaToken("");
      setRecaptchaKey((k) => k + 1);
      setError(data.message);
      toast?.error(data.message || "Login failed.");
    } catch (err) {
      const msg = "Something went wrong!";
      setError(msg);
      toast?.error(msg);
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

      {/* Main Card */}
      <div
        className={`relative z-10 w-full mx-4 transition-all duration-700
        ${requireCaptcha ? "max-w-lg" : "max-w-md"}
        ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300 text-sm">Sign in to continue to your account</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
            {/* EMAIL */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgotpassword"
                className="text-sm text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1"
              >
                Forgot password?
              </Link>
            </div>

            {/* reCAPTCHA "I'm not a robot" */}
            <div className="py-2">
              <RecaptchaWidget
                key={recaptchaKey}
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken("")}
              />
            </div>

            {/* Legacy CAPTCHA (after 3 failed attempts if reCAPTCHA not used) */}
            {requireCaptcha && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-sm text-gray-300">Security Verification Required</p>
                <img
                  src={captchaUrl}
                  className="w-full h-24 object-contain bg-white/5 rounded-lg border border-white/10"
                  alt="CAPTCHA"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter CAPTCHA"
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 
                               text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500
                               placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 
                               text-white rounded-lg transition-colors text-sm"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}

            {/* Login mode: User vs Admin */}
            <div className="flex gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => { setLoginAsAdmin(false); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!loginAsAdmin ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
              >
                Login as User
              </button>
              <button
                type="button"
                onClick={() => { setLoginAsAdmin(true); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginAsAdmin ? "bg-amber-500/90 text-gray-900" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
              >
                Login as Admin
              </button>
            </div>
            {loginAsAdmin && (
              <p className="text-amber-200/90 text-xs text-center">You will be taken to the Admin Dashboard. Only administrator accounts can sign in here.</p>
            )}

            {/* ERROR */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || accountLocked || (!recaptchaToken && !(requireCaptcha && captchaInput))}
              className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2
                ${accountLocked
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : accountLocked ? (
                <>
                  <Lock size={20} />
                  <span>ACCOUNT LOCKED</span>
                </>
              ) : (
                <>
                  <span>{loginAsAdmin ? "Sign in as Admin" : "Sign In"}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">Don't have an account?</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 text-center">
            <Link
              to="/register"
              className="block w-full py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 
                         border border-white/20 text-white transition-all text-sm"
            >
              Create New Account
            </Link>
            <Link
              to="/verify-otp"
              className="block text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              Verify OTP
            </Link>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
