import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Shield, ArrowRight, CheckCircle } from "lucide-react";
import RecaptchaWidget from "../components/RecaptchaWidget";

const Register = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({ label: "", level: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 300);
  }, []);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const upperCount = (password.match(/[A-Z]/g) || []).length;
    const lowerCount = (password.match(/[a-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    // Special characters excluding <, >, ?, !, ~
    const specialCount = (password.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length;
    
    if (upperCount >= 4) strength++;
    if (lowerCount >= 4) strength++;
    if (numberCount >= 3) strength++;
    if (specialCount >= 3) strength++;

    if (strength <= 2) return { label: "Weak", level: 1 };
    if (strength === 3) return { label: "Normal", level: 2 };
    return { label: "Strong", level: 3 };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === "password") {
      setPasswordStrength(getPasswordStrength(e.target.value));
    }
  };

  const validatePassword = (value: string) => {
    const upperCount = (value.match(/[A-Z]/g) || []).length;
    const lowerCount = (value.match(/[a-z]/g) || []).length;
    const numberCount = (value.match(/[0-9]/g) || []).length;
    // Special characters excluding <, >, ?, !, ~
    const specialCount = (value.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length;
    
    return (
      upperCount >= 4 &&
      lowerCount >= 4 &&
      numberCount >= 3 &&
      specialCount >= 3
    );
  };

  const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const handleSubmit = async () => {
    setError("");

    if (!isValidEmail(form.email)) return setError("Invalid email address.");
    if (!validatePassword(form.password))
      return setError("Password must have 4 uppercase, 4 lowercase, 3 digits, and 3 special characters (excluding <, >, ?, !, ~).");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (!recaptchaToken)
      return setError("Please complete the security verification (I'm not a robot).");

    try {
      setIsLoading(true);

      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptchaToken: recaptchaToken || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registered successfully. Check your email for OTP.");
        // Pass email and OTP expiry timestamp to VerifyOtp page
        navigate("/verify-otp", {
          state: {
            email: form.email,
            otpExpiresAt: data.otpExpiresAt,
          },
        });
      } else {
        setError(data.message || "Registration failed.");
        setRecaptchaToken("");
        setRecaptchaKey((k) => k + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative flex items-center justify-center overflow-hidden py-8">
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
        className={`relative z-10 w-full max-w-2xl mx-4 transition-all duration-700 ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-gray-300 text-sm">Join us and start your journey</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
            {/* Full Name */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 
                             text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                             focus:border-transparent placeholder-gray-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.level === 1
                          ? "bg-red-500 w-1/3"
                          : passwordStrength.level === 2
                          ? "bg-yellow-500 w-2/3"
                          : "bg-green-500 w-full"
                      }`}
                    ></div>
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength.level === 1
                      ? "text-red-400"
                      : passwordStrength.level === 2
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}>
                    Password Strength: {passwordStrength.label}
                  </p>
                </div>
              )}
              
              {/* Password Requirements */}
              {form.password && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <p className="font-semibold mb-2">Password Requirements:</p>
                  <div className="flex items-center gap-2">
                    <span className={(form.password.match(/[A-Z]/g) || []).length >= 4 ? "text-green-400" : "text-gray-500"}>
                      {(form.password.match(/[A-Z]/g) || []).length >= 4 ? "✓" : "○"}
                    </span>
                    <span>At least 4 uppercase letters ({(form.password.match(/[A-Z]/g) || []).length}/4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={(form.password.match(/[a-z]/g) || []).length >= 4 ? "text-green-400" : "text-gray-500"}>
                      {(form.password.match(/[a-z]/g) || []).length >= 4 ? "✓" : "○"}
                    </span>
                    <span>At least 4 lowercase letters ({(form.password.match(/[a-z]/g) || []).length}/4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={(form.password.match(/[0-9]/g) || []).length >= 3 ? "text-green-400" : "text-gray-500"}>
                      {(form.password.match(/[0-9]/g) || []).length >= 3 ? "✓" : "○"}
                    </span>
                    <span>At least 3 digits ({(form.password.match(/[0-9]/g) || []).length}/3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={(form.password.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length >= 3 ? "text-green-400" : "text-gray-500"}>
                      {(form.password.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length >= 3 ? "✓" : "○"}
                    </span>
                    <span>At least 3 special characters, excluding &lt;, &gt;, ?, !, ~ ({(form.password.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length}/3)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 
                           text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                           focus:border-transparent placeholder-gray-400 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              
              {/* Password Match Indicator */}
              {form.confirmPassword && (
                <div className="mt-2">
                  {form.password === form.confirmPassword ? (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle size={14} />
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* reCAPTCHA "I'm not a robot" */}
            <div className="py-2">
              <RecaptchaWidget
                key={recaptchaKey}
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken("")}
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r 
                         from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/50 
                         hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
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
              <span className="px-4 bg-transparent text-gray-400">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 
                       border border-white/20 text-white transition-all text-center text-sm"
          >
            Sign In Instead
          </Link>
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

export default Register;
