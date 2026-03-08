import React, { createContext, useCallback, useState } from "react";
import Toast from "../components/Toast";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;
function generateId() {
  return `toast-${Date.now()}-${++idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast("success", message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast("error", message, duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
