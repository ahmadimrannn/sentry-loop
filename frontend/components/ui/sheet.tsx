"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ isOpen, onClose, children, title }: SheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      {/* Sheet Content */}
      <div className="relative z-50 flex flex-col w-72 max-w-full bg-background border-r border-border p-4 shadow-xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title ?? "Navigation"}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-4">{children}</div>
      </div>
    </div>
  );
}
