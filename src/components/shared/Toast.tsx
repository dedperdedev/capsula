import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export const toast = {
  success(message: string) {
    this.show(message, 'success');
  },
  error(message: string) {
    this.show(message, 'error');
  },
  info(message: string) {
    this.show(message, 'info');
  },
  warning(message: string) {
    this.show(message, 'warning');
  },
  show(message: string, type: ToastType = 'info') {
    const id = crypto.randomUUID();
    toasts.push({ id, message, type });
    notify();

    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      notify();
    }, 3000);
  },
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const Icon = icons[t.type];

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-[18px] bg-[var(--surface)] border border-[var(--stroke)] shadow-lg min-w-[280px] max-w-[400px]'
      )}
    >
      <div className={clsx('p-1.5 rounded-full', colors[t.type])}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="flex-1 text-sm font-semibold text-[var(--text)]">{t.message}</p>
    </div>
  );
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  const container = (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {currentToasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );

  return createPortal(container, document.body);
}

