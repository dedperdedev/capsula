/**
 * Today Header V2 - Calm iOS-like design
 * Features: Profile avatar, progress ring, date navigation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, BarChart3 } from 'lucide-react';
import { addDays, subDays, startOfDay } from 'date-fns';
import { loadAppState } from '../../data/storage';
import { useI18n } from '../../hooks/useI18n';
import { formatHeroDateLabel } from '../../utils/date';
import { ProfileSwitcher } from '../ProfileSwitcher';
import { BlueHeroHeader } from '../shared/BlueHeroHeader';

/**
 * Ring Progress Component
 * Reusable SVG-based ring progress indicator
 */
interface RingProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
}

function RingProgress({ 
  value, 
  size = 110, 
  strokeWidth = 6,
  trackColor = 'rgba(255, 255, 255, 0.3)',
  progressColor = 'rgba(255, 255, 255, 0.9)'
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90" 
        width={size} 
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-white">
          {value}%
        </span>
      </div>
    </div>
  );
}

interface TodayHeaderV2Props {
  totalDoses: number;
  taken: number;
  selectedDate: Date;
  onProfileChange?: () => void;
  onDateChange?: (date: Date) => void;
}

export function TodayHeaderV2({ 
  totalDoses, 
  taken,
  selectedDate,
  onProfileChange,
  onDateChange 
}: TodayHeaderV2Props) {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState<{ name: string; color: string } | null>(null);
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    const handleProfileUpdate = () => {
      loadProfile();
      onProfileChange?.();
    };
    window.addEventListener('profileChanged', handleProfileUpdate);
    return () => window.removeEventListener('profileChanged', handleProfileUpdate);
  }, []);

  const loadProfile = () => {
    const state = loadAppState();
    const profile = state.profiles.find(p => p.id === state.activeProfileId);
    if (profile) {
      setActiveProfile({ name: profile.name, color: profile.color || '#3b82f6' });
    }
  };

  const adherence = totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 0;

  // Check if selected date is today for message
  const isSelectedDateToday = (() => {
    const today = startOfDay(new Date());
    const selected = startOfDay(selectedDate);
    return today.getTime() === selected.getTime();
  })();

  // Primary message: "X из Y лекарств вы приняли сегодня" / "X of Y medications you took today"
  // Or adjusted for selected date
  const primaryMessage = (() => {
    if (isSelectedDateToday) {
      return locale === 'ru'
        ? `${taken} из ${totalDoses} лекарств вы приняли сегодня`
        : `${taken} of ${totalDoses} medications you took today`;
    } else {
      // For past/future dates, use generic wording
      return locale === 'ru'
        ? `${taken} из ${totalDoses} лекарств принято`
        : `${taken} of ${totalDoses} medications taken`;
    }
  })();

  // Subtext: "Не забудьте внести остальные" / "Don't forget to enter the rest"
  const subtext = locale === 'ru'
    ? 'Не забудьте внести остальные'
    : "Don't forget to enter the rest";

  const handleDatePrev = () => {
    const newDate = startOfDay(subDays(selectedDate, 1));
    onDateChange?.(newDate);
  };

  const handleDateNext = () => {
    const newDate = startOfDay(addDays(selectedDate, 1));
    onDateChange?.(newDate);
  };

  const leftAction = (
    <button
      onClick={() => setIsProfileSwitcherOpen(true)}
      className="flex items-center gap-3 active:opacity-80 transition-opacity"
      aria-label="Switch profile"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base border-2 border-white/30 shadow-md"
        style={{ backgroundColor: activeProfile?.color || '#3b82f6' }}
      >
        {activeProfile?.name.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="text-left">
        <p className="text-base font-medium text-white leading-tight">
          {activeProfile?.name || (locale === 'ru' ? 'Профиль' : 'Profile')}
        </p>
      </div>
    </button>
  );

  const rightActions = (
    <>
      <button
        onClick={() => navigate('/search')}
        className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center active:opacity-80 transition-opacity"
        aria-label={locale === 'ru' ? 'Поиск' : 'Search'}
      >
        <Search size={20} className="text-gray-700" />
      </button>
      <button
        onClick={() => navigate('/insights')}
        className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center active:opacity-80 transition-opacity"
        aria-label={locale === 'ru' ? 'Статистика' : 'Statistics'}
      >
        <BarChart3 size={20} className="text-gray-700" />
      </button>
    </>
  );

  const customContent = (
    <>
      {/* Main message + Ring Progress */}
      <div className="flex items-center gap-4 mb-4">
        {/* Text Content */}
        <div className="flex-1">
          <p className="text-[28px] font-medium text-white mb-2 leading-tight">
            {primaryMessage}
          </p>
          {totalDoses > taken && (
            <p className="text-sm text-white/80 leading-tight">
              {subtext}
            </p>
          )}
        </div>

        {/* Ring Progress - Large (92-110px) */}
        <div className="flex-shrink-0">
          <RingProgress 
            value={adherence} 
            size={110}
            strokeWidth={6}
            trackColor="rgba(255, 255, 255, 0.3)"
            progressColor="rgba(255, 255, 255, 0.9)"
          />
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handleDatePrev}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 active:scale-[0.98] transition-all hover:text-white"
          aria-label={locale === 'ru' ? 'Предыдущий день' : 'Previous day'}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-medium text-white min-w-[160px] text-center">
          {formatHeroDateLabel(selectedDate, locale)}
        </span>
        <button
          onClick={handleDateNext}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 active:scale-[0.98] transition-all hover:text-white"
          aria-label={locale === 'ru' ? 'Следующий день' : 'Next day'}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <BlueHeroHeader
        variant="large"
        title={primaryMessage}
        subtitle={totalDoses > taken ? subtext : undefined}
        leftAction={leftAction}
        rightActions={rightActions}
      >
        {customContent}
      </BlueHeroHeader>

      {/* Profile Switcher Modal */}
      <ProfileSwitcher
        isOpen={isProfileSwitcherOpen}
        onClose={() => setIsProfileSwitcherOpen(false)}
        onProfileChange={() => {
          loadProfile();
          onProfileChange?.();
        }}
      />
    </>
  );
}
