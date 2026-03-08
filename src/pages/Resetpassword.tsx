import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, KeyRound, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import RecaptchaWidget from "../components/RecaptchaWidget";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fade, setFade] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ label: "", level: 0 });
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaKey, setRecaptchaKey] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract token and email from URL query string
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const email = params.get("email");

  useEffect(() => {
    setTimeout(() => setFade(true), 200);
    if (!token || !email) {
      setError("Invalid reset link. Please check your email and try again.");
    }
  }, [token, email]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if ((password.match(/[0-9]/g) || []).length >= 2) strength++;

    if (strength <= 2) return { label: "Weak", level: 1 };
    if (strength === 3) return { label: "Normal", level: 2 };
    return { label: "Strong", level: 3 };
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || !confirmNewPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (!recaptchaToken) {
      setError("Please complete the security verification (I'm not a robot).");
      return;
    }

    // Password validation
    const upperCount = (newPassword.match(/[A-Z]/g) || []).length;
    const lowerCount = (newPassword.match(/[a-z]/g) || []).length;
    const numberCount = (newPassword.match(/[0-9]/g) || []).length;
    // Special characters excluding <, >, ?, !, ~
    const specialCount = (newPassword.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length;

    if (upperCount < 4 || lowerCount < 4 || numberCount < 3 || specialCount < 3) {
      setError("Password must have 4 uppercase, 4 lowercase, 3 digits, and 3 special characters (excluding <, >, ?, !, ~).");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/api/resetpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmNewPassword,
          recaptchaToken,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
        setRecaptchaToken("");
        setRecaptchaKey((k) => k + 1);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setRecaptchaToken("");
      setRecaptchaKey((k) => k + 1);
    } finally {
      setIsLoading(false);
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
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700
        ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-300 text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                  <Lock size={20} />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 
                             text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500
                             focus:border-transparent placeholder-gray-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
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
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                <p className="font-semibold mb-2">Password Requirements:</p>
                <div className="flex items-center gap-2">
                  <span className={(newPassword.match(/[A-Z]/g) || []).length >= 4 ? "text-green-400" : "text-gray-500"}>
                    {(newPassword.match(/[A-Z]/g) || []).length >= 4 ? "✓" : "○"}
                  </span>
                  <span>At least 4 uppercase letters ({(newPassword.match(/[A-Z]/g) || []).length}/4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={(newPassword.match(/[a-z]/g) || []).length >= 4 ? "text-green-400" : "text-gray-500"}>
                    {(newPassword.match(/[a-z]/g) || []).length >= 4 ? "✓" : "○"}
                  </span>
                  <span>At least 4 lowercase letters ({(newPassword.match(/[a-z]/g) || []).length}/4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={(newPassword.match(/[0-9]/g) || []).length >= 3 ? "text-green-400" : "text-gray-500"}>
                    {(newPassword.match(/[0-9]/g) || []).length >= 3 ? "✓" : "○"}
                  </span>
                  <span>At least 3 digits ({(newPassword.match(/[0-9]/g) || []).length}/3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={(newPassword.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length >= 3 ? "text-green-400" : "text-gray-500"}>
                    {(newPassword.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length >= 3 ? "✓" : "○"}
                  </span>
                  <span>At least 3 special characters, excluding &lt;, &gt;, ?, !, ~ ({(newPassword.match(/[^a-zA-Z0-9\s<>\?!~]/g) || []).length}/3)</span>
                </div>
              </div>
            )}

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
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle size={18} />
                <span>{message}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading || !token || !email || !recaptchaToken}
              className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r 
                         from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/50 
                         hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
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
              <span className="px-4 bg-transparent text-gray-400">Remember your password?</span>
            </div>
          </div>

          {/* Back to Login Link */}
          <Link
            to="/login"
            className="block w-full py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 
                       border border-white/20 text-white transition-all text-center text-sm"
          >
            Back to Sign In
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

export default ResetPassword;
