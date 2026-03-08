import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        theme?: "light" | "dark";
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
      }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SCRIPT_URL = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
}

export default function RecaptchaWidget({ onVerify, onExpire, theme: themeProp = "light" }: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) {
      setError("reCAPTCHA site key not configured (VITE_RECAPTCHA_SITE_KEY).");
      return;
    }

    if (window.grecaptcha) {
      setReady(true);
      return;
    }

    window.onRecaptchaLoad = () => {
      setReady(true);
    };

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onerror = () => setError("Failed to load reCAPTCHA.");
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window.onRecaptchaLoad;
    };
  }, [siteKey]);

  useEffect(() => {
    if (!ready || !siteKey || !containerRef.current || !window.grecaptcha) return;

    const container = containerRef.current;
    if (container.children.length > 0) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(container, {
        sitekey: siteKey,
        theme: themeProp,
        callback: (token: string) => {
          onVerify(token);
        },
        "expired-callback": () => {
          onExpire?.();
        },
      });
    } catch (e) {
      setError("Failed to render reCAPTCHA.");
    }

    return () => {
      if (widgetIdRef.current != null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [ready, siteKey, themeProp, onVerify, onExpire]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        {error} Add VITE_RECAPTCHA_SITE_KEY to your .env for production.
      </div>
    );
  }

  if (!siteKey) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-400">
        Security verification (reCAPTCHA) not configured. Set VITE_RECAPTCHA_SITE_KEY in .env.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-400">Security Verification</p>
      <div ref={containerRef} className="flex justify-start [&_.grecaptcha-badge]:bottom-0" />
    </div>
  );
}
