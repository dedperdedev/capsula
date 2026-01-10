import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from '../components/Shell';
import { ToastContainer } from '../components/shared/Toast';
import { LockScreen } from '../components/LockScreen';
import { TodayPage } from '../pages/TodayPage';
import { SchedulePage } from '../pages/SchedulePage';
import { LibraryPage } from '../pages/LibraryPage';
import { InsightsPage } from '../pages/InsightsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { DrugDetailsPage } from '../pages/DrugDetailsPage';
import { DiaryPage } from '../pages/DiaryPage';
import { ShoppingListPage } from '../pages/ShoppingListPage';
import { FamilyOverviewPage } from '../pages/FamilyOverviewPage';
import { SharePage } from '../pages/SharePage';
import { TestPage } from '../pages/TestPage';
import { SearchPage } from '../pages/SearchPage';
import { StatsExtendedPage } from '../pages/StatsExtendedPage';
import { MedicationEditPage } from '../pages/MedicationEditPage';
import { MedicationDetailsPage } from '../pages/MedicationDetailsPage';
import { isPinEnabled, shouldLock, recordUnlock, handleVisibilityChange } from '../lib/appLock';

function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check lock status on mount
    if (isPinEnabled() && shouldLock()) {
      setIsLocked(true);
    }
    setIsChecking(false);

    // Handle visibility changes (lock on background if configured)
    const handleVisibility = () => {
      if (handleVisibilityChange()) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleUnlock = () => {
    recordUnlock();
    setIsLocked(false);
  };

  if (isChecking) {
    return null; // Or a loading spinner
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <BrowserRouter basename="/capsula">
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/drug/:id" element={<DrugDetailsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/shopping" element={<ShoppingListPage />} />
          <Route path="/family" element={<FamilyOverviewPage />} />
          <Route path="/share/:code" element={<SharePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stats-extended" element={<StatsExtendedPage />} />
          <Route path="/medications/:itemId" element={<MedicationDetailsPage />} />
          <Route path="/medications/:itemId/edit" element={<MedicationEditPage />} />
          <Route path="/medications/:itemId/:scheduleId/edit" element={<MedicationEditPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
        <ToastContainer />
      </Shell>
    </BrowserRouter>
  );
}

export default App;
