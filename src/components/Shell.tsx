import { type ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ScanLine, User } from 'lucide-react';
import { DrugSearch } from './DrugSearch';
import { ProfileSwitcher } from './ProfileSwitcher';
import { QuickAddWizard } from './QuickAddWizard';
import { loadAppState } from '../data/storage';

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<{ name: string; color: string } | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const isTodayPage = location.pathname === '/today';
  const isMedicationPage = location.pathname.startsWith('/medications/');
  const isSearchPage = location.pathname === '/search';

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

  // Listen for QuickAddWizard event globally
  useEffect(() => {
    const handleOpenQuickAdd = () => {
      setIsQuickAddOpen(true);
    };
    window.addEventListener('openQuickAddWizard', handleOpenQuickAdd);
    return () => {
      window.removeEventListener('openQuickAddWizard', handleOpenQuickAdd);
    };
  }, []);

  return (
    <div className="relative overflow-hidden min-h-dvh bg-[var(--bg)]">
      {/* Background gradient layer - behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-radial" />
      
      {/* App frame container - blue top for Today page to avoid white strip above hero */}
      <div 
        className="relative z-10 mx-auto max-w-[430px] min-h-dvh flex flex-col"
        style={isTodayPage ? {
          background: 'linear-gradient(to bottom, #5C8FF0 0%, #5C8FF0 300px, var(--bg) 300px)'
        } : undefined}
      >
        {/* Header - only shown on Search page with search bar, removed from all other pages */}
        {isSearchPage && (
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
        )}

        <ProfileSwitcher
          isOpen={isProfileSwitcherOpen}
          onClose={() => setIsProfileSwitcherOpen(false)}
          onProfileChange={() => {
            loadProfile();
            window.location.reload();
          }}
        />
        
        {/* Main content - scrollable, above background */}
        {/* Bottom padding: pill height (56px) + safe area + spacing (24px) = 80px base + safe-area (except medication pages) */}
        <main 
          className="relative z-10 flex-1 overflow-y-auto min-h-0"
          style={{ 
            paddingBottom: isMedicationPage ? '0px' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
            paddingLeft: isMedicationPage ? '0px' : '18px',
            paddingRight: isMedicationPage ? '0px' : '18px',
            paddingTop: (isMedicationPage || isTodayPage || isSearchPage) ? '0px' : '16px',
          }}
        >
          <div className="relative z-10">
            {children}
          </div>
        </main>
        
        {/* Bottom navigation - fixed, above everything (hidden on medication drill-in pages) */}
        {!isMedicationPage && <BottomNav />}
      </div>

      {/* Global QuickAddWizard - available on all pages */}
      <QuickAddWizard
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onComplete={() => {
          setIsQuickAddOpen(false);
          // Navigate to today page after adding
          if (location.pathname !== '/today') {
            navigate('/today');
          }
        }}
      />
    </div>
  );
}



