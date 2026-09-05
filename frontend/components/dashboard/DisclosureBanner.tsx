/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function DisclosureBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("sentryloop_disclosure_dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("sentryloop_disclosure_dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-900 border-b border-border py-2 px-4 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between gap-3 shrink-0">
      <p className="leading-normal font-sans">
        This is a personal showcase project, not a multi-tenant product, there is no data isolation between accounts, and every incident shown is a real bug from my own production apps (Lumen, CogniLead).
      </p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
        aria-label="Dismiss disclosure"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
