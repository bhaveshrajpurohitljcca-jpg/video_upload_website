'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let listeners: ToastListener[] = [];
let toastsList: ToastItem[] = [];

const notify = () => {
  listeners.forEach((listener) => listener([...toastsList]));
};

export const toast = {
  success(message: string, duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    toastsList.push({ id, type: 'success', message, duration });
    notify();
  },
  error(message: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    toastsList.push({ id, type: 'error', message, duration });
    notify();
  },
  info(message: string, duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    toastsList.push({ id, type: 'info', message, duration });
    notify();
  },
  dismiss(id: string) {
    toastsList = toastsList.filter((t) => t.id !== id);
    notify();
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToasts = (newList: ToastItem[]) => {
      setToasts(newList);
    };
    listeners.push(handleToasts);
    setToasts([...toastsList]);

    return () => {
      listeners = listeners.filter((l) => l !== handleToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem }> = ({ toast: t }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        toast.dismiss(t.id);
      }, 300); // Wait for fade out animation
    }, t.duration || 3000);

    return () => clearTimeout(timer);
  }, [t]);

  const getIcon = () => {
    switch (t.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-sky-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (t.type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/20';
      case 'error':
        return 'border-red-500/30 bg-red-950/20';
      case 'info':
      default:
        return 'border-sky-500/30 bg-sky-950/20';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all duration-300 ${getBorderColor()} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="text-sm font-medium text-zinc-200">{t.message}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => toast.dismiss(t.id), 300);
        }}
        className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
