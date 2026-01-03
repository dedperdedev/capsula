import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from '../components/Shell';
import { ToastContainer } from '../components/shared/Toast';
import { TodayPage } from '../pages/TodayPage';
import { SchedulePage } from '../pages/SchedulePage';
import { LibraryPage } from '../pages/LibraryPage';
import { InsightsPage } from '../pages/InsightsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { DrugDetailsPage } from '../pages/DrugDetailsPage';
import { TestPage } from '../pages/TestPage';

function App() {
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
          <Route path="/test" element={<TestPage />} />
        </Routes>
        <ToastContainer />
      </Shell>
    </BrowserRouter>
  );
}

export default App;
