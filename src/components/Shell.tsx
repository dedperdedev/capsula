import { type ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ProfileSwitcher } from './ProfileSwitcher';
import { QuickAddWizard } from './QuickAddWizard';

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const isTodayPage = location.pathname === '/today';
  const isMedicationPage = location.pathname.startsWith('/medications/');
  const isSearchPage = location.pathname === '/search';

  const loadProfile = () => {
    // Function exists for ProfileSwitcher callback, but not needed for Search page header
  };

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
    <div className="relative h-full min-h-dvh flex flex-col bg-[var(--bg)]">
      {/* Background gradient layer - behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-radial" />
      
      {/* App frame container - blue top for Today page to avoid white strip above hero */}
      <div 
        className="relative z-10 mx-auto w-full max-w-[430px] h-full min-h-dvh flex flex-col"
        style={isTodayPage ? {
          background: 'linear-gradient(to bottom, #5C8FF0 0%, #5C8FF0 300px, var(--bg) 300px)'
        } : {
          background: 'var(--bg)'
        }}
      >
        {/* Header removed from Search page - search is now only in content */}

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
          className="relative z-10 flex-1 overflow-y-auto min-h-0 bg-[var(--bg)]"
          style={{ 
            paddingBottom: isMedicationPage ? '0px' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
            paddingLeft: isMedicationPage ? '0px' : '18px',
            paddingRight: isMedicationPage ? '0px' : '18px',
            paddingTop: (isMedicationPage || isTodayPage || isSearchPage) ? '0px' : '16px',
          }}
        >
          <div className="relative z-10 min-h-full">
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



