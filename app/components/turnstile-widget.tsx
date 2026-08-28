"use client";

import { useEffect, useRef, useState } from "react";
import { TURNSTILE_CONFIG_API_PATH } from "../lib/site-paths";

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global { interface Window { turnstile?: TurnstileApi; } }

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ resetKey, onToken, onError }: { resetKey: number; onToken: (token: string) => void; onError: (message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(TURNSTILE_CONFIG_API_PATH).then(async (response) => {
        if (!response.ok) throw new Error("Turnstile config unavailable");
        return response.json() as Promise<{ siteKey: string; action: string }>;
      }),
      loadScript(),
    ]).then(([config]) => {
      if (!active || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: config.siteKey,
        action: config.action,
        theme: "light",
        size: "flexible",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onError("安全驗證載入失敗，請重新整理後再試。"),
      });
      setReady(true);
    }).catch(() => active && onError("安全驗證暫時無法載入，請稍後再試。"));
    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
  }, [onError, onToken]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
    }
  }, [onToken, resetKey]);

  return <div className="turnstile-wrap"><div ref={containerRef} aria-label="Cloudflare Turnstile 安全驗證" /><small>{ready ? "完成安全驗證後即可送出。" : "正在載入安全驗證…"}</small></div>;
}
