"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, X, AlertTriangle, Info, Heart, Bookmark, Star, ArrowUp, ArrowDown, MessageSquare } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "vote" | "save" | "award";
  icon?: ReactNode;
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const iconMap: Record<string, ReactNode> = {
  success: <Check size={14} className="text-green-400" />,
  error: <AlertTriangle size={14} className="text-red-400" />,
  info: <Info size={14} className="text-blue-400" />,
  vote: <ArrowUp size={14} className="text-[#ff4444]" />,
  save: <Bookmark size={14} className="text-nf-accent" />,
  award: <Star size={14} className="text-yellow-400" />,
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ direction: "rtl" }}>
        {toasts.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-nf-primary/95 border border-nf-border-2 shadow-xl shadow-black/30 backdrop-blur-sm pointer-events-auto animate-in fade-in zoom-in duration-200"
            >
              <span className="shrink-0">{iconMap[t.type] || iconMap.success}</span>
              <span className="text-[13px] text-white font-medium">{t.message}</span>
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
}
