import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, RefreshCw, CheckCircle, AlertCircle, Lock } from "lucide-react";

const Captcha = () => {
  const [captchaUrl, setCaptchaUrl] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [successCount, setSuccessCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const requiredSuccess = 3;
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    try {
      setIsLoading(true);
      if (captchaUrl) URL.revokeObjectURL(captchaUrl);

      const response = await fetch("http://localhost:8000/api/captcha", {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        setCaptchaUrl(URL.createObjectURL(blob));
        setError("");
      } else setError("Unable to load CAPTCHA");
    } catch (err) {
      console.error(err);
      setError("Error fetching CAPTCHA");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    return () => {
      if (captchaUrl) URL.revokeObjectURL(captchaUrl);
    };
  }, []);

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage("");
    }, 3000);
  };

  const handleVerify = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/verify-captcha", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userInput }),
      });
      const data = await res.json();

      if (data.success) {
        const newSuccess = successCount + 1;
        setSuccessCount(newSuccess);
        setUserInput("");
        setError("");
        setMessage(`Success! ${newSuccess} of ${requiredSuccess} verified`);

        const remaining = requiredSuccess - newSuccess;
        if (remaining > 0) {
          showToastMessage(`${remaining} verification${remaining > 1 ? 's' : ''} remaining`);
        }

        if (newSuccess >= requiredSuccess) {
          setMessage("All verifications complete! Redirecting...");
          showToastMessage("All verifications complete! Redirecting to register...");
          setTimeout(() => navigate("/register"), 1500);
        } else {
          fetchCaptcha();
        }
      } else {
        setError(data.message || "Incorrect code. Please try again.");
        setUserInput("");
        fetchCaptcha();
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed. Please try again.");
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

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Security Verification
          </h1>
          <p className="text-gray-300 text-sm">
            Complete {requiredSuccess} CAPTCHA verifications to continue
          </p>
        </div>

        {/* CAPTCHA Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">Progress</span>
              <span className="text-sm text-purple-400 font-semibold">
                {successCount} / {requiredSuccess}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(successCount / requiredSuccess) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* CAPTCHA Image */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-3 font-medium">
              Enter the code shown below
            </label>
            <div className="relative">
              {isLoading ? (
                <div className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              ) : captchaUrl ? (
                <div className="w-full h-32 bg-white rounded-lg border-2 border-white/30 overflow-hidden shadow-lg">
                  <img
                    src={captchaUrl}
                    alt="CAPTCHA"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-red-500/20 border-2 border-red-500/50 rounded-xl flex items-center justify-center">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Failed to load CAPTCHA</span>
                  </div>
                </div>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={fetchCaptcha}
                disabled={isLoading}
                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh CAPTCHA"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Input Field */}
          <div className="mb-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter CAPTCHA code"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                spellCheck={false}
                autoComplete="off"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading && userInput.trim()) {
                    handleVerify();
                  }
                }}
              />
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || !userInput.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Verify & Continue</span>
              </>
            )}
          </button>

          {/* Feedback Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && !error && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-300 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Info Text */}
        <p className="text-center text-gray-400 text-xs mt-6">
          This verification helps protect against automated attacks
        </p>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up flex items-center gap-3 min-w-[300px] max-w-md">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-purple-400" />
          </div>
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Captcha;
