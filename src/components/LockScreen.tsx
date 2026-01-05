/**
 * Lock Screen
 * PIN entry screen for app lock feature
 */

import { useState, useEffect, useRef } from 'react';
import { Lock, Delete, Download } from 'lucide-react';
import { verifyPin, recordUnlock } from '../lib/appLock';
import { downloadBackup } from '../data/backup';
import { useI18n } from '../hooks/useI18n';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { locale } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_ATTEMPTS = 5;
  const isLocked = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = async () => {
    if (isLocked || isVerifying) return;
    
    setIsVerifying(true);
    setError(false);

    try {
      const isValid = await verifyPin(pin);
      
      if (isValid) {
        recordUnlock();
        onUnlock();
      } else {
        setError(true);
        setAttempts(prev => prev + 1);
        setPin('');
        
        // Vibrate on error if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isLocked) {
      setPin(prev => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleEmergencyExport = () => {
    downloadBackup();
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex flex-col items-center justify-center p-6 z-50">
      {/* Logo/Icon */}
      <div className="mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Lock size={40} className="text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
        Capsula
      </h1>
      <p className="text-[var(--muted)] mb-8">
        {locale === 'ru' ? 'Введите PIN-код' : 'Enter your PIN'}
      </p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              pin.length > i 
                ? error 
                  ? 'bg-red-500 scale-110' 
                  : 'bg-blue-500 scale-110'
                : 'bg-[var(--surface2)]'
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mb-4 animate-shake">
          {locale === 'ru' ? 'Неверный PIN-код' : 'Incorrect PIN'}
          {attempts > 0 && ` (${attempts}/${MAX_ATTEMPTS})`}
        </p>
      )}

      {isLocked && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 text-center">
          <p className="text-red-400 font-semibold">
            {locale === 'ru' 
              ? 'Слишком много попыток'
              : 'Too many attempts'
            }
          </p>
          <p className="text-red-400/70 text-sm mt-1">
            {locale === 'ru'
              ? 'Подождите несколько минут'
              : 'Please wait a few minutes'
            }
          </p>
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === 'del') handleDelete();
              else if (key) handleDigit(key);
            }}
            disabled={isLocked || isVerifying}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold transition-all ${
              key === ''
                ? 'invisible'
                : key === 'del'
                ? 'bg-[var(--surface2)] text-[var(--muted)] hover:bg-[var(--surface3)]'
                : 'bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface3)] active:scale-95'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {key === 'del' ? <Delete size={24} /> : key}
          </button>
        ))}
      </div>

      {/* Hidden input for accessibility */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="sr-only"
        aria-label="PIN input"
      />

      {/* Emergency export */}
      <div className="mt-8 text-center">
        <button
          onClick={handleEmergencyExport}
          className="flex items-center gap-2 text-[var(--muted2)] hover:text-[var(--muted)] text-sm transition-colors"
        >
          <Download size={14} />
          {locale === 'ru' ? 'Экстренный экспорт' : 'Emergency Export'}
        </button>
        <p className="text-xs text-[var(--muted2)] mt-2 max-w-xs">
          {locale === 'ru'
            ? 'Экспортировать данные без разблокировки (данные зашифрованы)'
            : 'Export data without unlocking (data is encrypted)'
          }
        </p>
      </div>
    </div>
  );
}

