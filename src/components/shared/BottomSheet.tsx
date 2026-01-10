/**
 * Bottom Sheet / Action Sheet Component
 * iOS-style modal that slides up from bottom
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const bottomSheetContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-zinc-900 rounded-t-[24px] shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ maxWidth: '430px', margin: '0 auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-4 border-b border-[var(--stroke)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 hover:bg-[var(--surface2)] rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-[var(--muted2)]" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(bottomSheetContent, document.body);
}
