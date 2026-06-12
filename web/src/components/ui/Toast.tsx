"use client";

import { useEffect } from "react";

export type ToastData =
  | { type: "success" | "error"; message: string }
  | { type: "confirm"; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string };

interface Props {
  toast: ToastData;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 3000;

export function Toast({ toast, onClose }: Props) {
  useEffect(() => {
    if (toast.type === "confirm") return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const base = "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl text-sm font-medium min-w-64 max-w-sm";

  if (toast.type === "confirm") {
    return (
      <div className={`${base} bg-slate-800 text-white border border-slate-700`}>
        <span className="flex-1">{toast.message}</span>
        <button onClick={toast.onCancel} className="text-slate-400 hover:text-white transition-colors px-2 py-1 rounded">
          Cancel
        </button>
        <button onClick={toast.onConfirm} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors">
          {toast.confirmLabel ?? "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <div className={`${base} ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      <span>{toast.type === "success" ? "✓" : "✕"}</span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}
