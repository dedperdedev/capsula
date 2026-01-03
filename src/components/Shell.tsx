import { type ReactNode, useState, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { ScanLine, User } from 'lucide-react';
import { DrugSearch } from './DrugSearch';
import { ProfileSwitcher } from './ProfileSwitcher';
import { loadAppState } from '../data/storage';

export function Shell({ children }: { children: ReactNode }) {
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<{ name: string; color: string } | null>(null);

  const loadProfile = () => {
    const state = loadAppState();
    const profile = state.profiles.find(p => p.id === state.activeProfileId);
    if (profile) {
      setActiveProfile({ name: profile.name, color: profile.color || '#3b82f6' });
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="relative overflow-hidden min-h-dvh bg-[var(--bg)]">
      {/* Background gradient layer - behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-radial" />
      
      {/* App frame container */}
      <div className="relative z-10 mx-auto max-w-[430px] min-h-dvh flex flex-col">
        {/* Header - sticky, above content */}
        <header className="sticky top-0 z-30 bg-[var(--surface)]/80 backdrop-blur-lg border-b border-[var(--stroke)] overflow-visible">
          <div className="px-[18px] py-3">
            <div className="flex items-center gap-3">
              {/* Profile Button */}
              <button
                onClick={() => setIsProfileSwitcherOpen(true)}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform active:scale-95"
                style={{ backgroundColor: activeProfile?.color || '#3b82f6' }}
                aria-label="Switch profile"
              >
                {activeProfile?.name.charAt(0).toUpperCase() || <User size={16} />}
              </button>

              {/* Search */}
              <div className="flex-1 relative">
                <DrugSearch />
              </div>

              {/* Scan Button */}
              <button
                className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
                aria-label="Scan barcode"
              >
                <ScanLine size={18} />
              </button>
            </div>
          </div>
        </header>

        <ProfileSwitcher
          isOpen={isProfileSwitcherOpen}
          onClose={() => setIsProfileSwitcherOpen(false)}
          onProfileChange={() => {
            loadProfile();
            window.location.reload();
          }}
        />
        
        {/* Main content - scrollable, above background */}
        <main className="relative z-10 flex-1 px-[18px] py-4 pb-24 overflow-y-auto min-h-0">
          <div className="relative z-10">
            {children}
          </div>
        </main>
        
        {/* Bottom navigation - fixed, above everything */}
        <BottomNav />
      </div>
    </div>
  );
}



