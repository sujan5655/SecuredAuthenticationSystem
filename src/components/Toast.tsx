import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const TOAST_DURATION_MS = 4000;

export type ToastType = "success" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? TOAST_DURATION_MS;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [toast.id, duration, onClose]);

  const isSuccess = toast.type === "success";

  return (
    <div
      className="flex items-start gap-3 rounded-xl shadow-lg border p-4 bg-white min-w-[320px] max-w-md"
      role="alert"
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? "bg-green-500" : "bg-red-500"}`}
      >
        {isSuccess ? (
          <CheckCircle className="w-6 h-6 text-white" />
        ) : (
          <XCircle className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-medium ${isSuccess ? "text-gray-900" : "text-gray-900"}`}>
          {toast.message}
        </p>
        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-75 ${isSuccess ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Toast;
