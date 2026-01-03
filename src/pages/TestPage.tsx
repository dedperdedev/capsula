/**
 * QA/Test page for verifying infrastructure
 * This page should be removed or hidden in production
 */

import { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { 
  loadAppState, 
  saveAppState, 
  appendEvent,
  type AppState,
} from '../data/storage';
import {
  getTodayDoses,
  getNextDose,
} from '../data/eventLog';

export function TestPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [todayDoses, setTodayDoses] = useState<any[]>([]);
  const [nextDose, setNextDose] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = () => {
    const appState = loadAppState();
    setState(appState);
    
    if (appState.activeProfileId) {
      const doses = getTodayDoses(appState.activeProfileId);
      setTodayDoses(doses);
      setNextDose(getNextDose(appState.activeProfileId));
    }
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStorageLoad = () => {
    try {
      const loaded = loadAppState();
      addTestResult(`✅ Storage loaded: ${loaded.profiles.length} profiles, ${loaded.medications.length} medications, ${loaded.events.length} events`);
      return true;
    } catch (error) {
      addTestResult(`❌ Storage load failed: ${error}`);
      return false;
    }
  };

  const testStorageSave = () => {
    try {
      const current = loadAppState();
      saveAppState(current);
      addTestResult(`✅ Storage save successful`);
      return true;
    } catch (error) {
      addTestResult(`❌ Storage save failed: ${error}`);
      return false;
    }
  };

  const testEventLog = () => {
    try {
      if (!state?.activeProfileId) {
        addTestResult(`❌ No active profile`);
        return false;
      }

      const testEvent = appendEvent({
        profileId: state.activeProfileId,
        ts: new Date().toISOString(),
        type: 'PROFILE_UPDATED',
        metadata: { test: true },
      });

      addTestResult(`✅ Event logged: ${testEvent.id}`);
      loadState();
      return true;
    } catch (error) {
      addTestResult(`❌ Event log failed: ${error}`);
      return false;
    }
  };

  const testTodayDoses = () => {
    try {
      if (!state?.activeProfileId) {
        addTestResult(`❌ No active profile`);
        return false;
      }

      const doses = getTodayDoses(state.activeProfileId);
      addTestResult(`✅ Today doses: ${doses.length} found`);
      return true;
    } catch (error) {
      addTestResult(`❌ Today doses failed: ${error}`);
      return false;
    }
  };

  const testNextDose = () => {
    try {
      if (!state?.activeProfileId) {
        addTestResult(`❌ No active profile`);
        return false;
      }

      const next = getNextDose(state.activeProfileId);
      if (next) {
        addTestResult(`✅ Next dose: ${next.medicationId} at ${new Date(next.plannedTime).toLocaleTimeString()}`);
      } else {
        addTestResult(`ℹ️ No next dose found`);
      }
      return true;
    } catch (error) {
      addTestResult(`❌ Next dose failed: ${error}`);
      return false;
    }
  };

  const testMigration = () => {
    try {
      // Check if old data exists
      const oldItems = localStorage.getItem('capsula_items');
      const oldSchedules = localStorage.getItem('capsula_schedules');
      const oldDoseLogs = localStorage.getItem('capsula_dose_logs');
      const oldInventory = localStorage.getItem('capsula_inventory');

      const hasOldData = !!(oldItems || oldSchedules || oldDoseLogs || oldInventory);
      
      if (hasOldData) {
        addTestResult(`ℹ️ Old data detected - migration should happen on next load`);
      } else {
        addTestResult(`ℹ️ No old data found - using new format`);
      }

      // Reload to trigger migration
      loadState();
      addTestResult(`✅ State reloaded - check if migration occurred`);
      return true;
    } catch (error) {
      addTestResult(`❌ Migration test failed: ${error}`);
      return false;
    }
  };

  const testAll = () => {
    setTestResults([]);
    addTestResult('🧪 Starting tests...');
    
    setTimeout(() => testStorageLoad(), 100);
    setTimeout(() => testStorageSave(), 200);
    setTimeout(() => testEventLog(), 300);
    setTimeout(() => testTodayDoses(), 400);
    setTimeout(() => testNextDose(), 500);
    setTimeout(() => testMigration(), 600);
    setTimeout(() => addTestResult('✅ All tests completed'), 700);
  };

  if (!state) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-[var(--text)]">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h1 className="text-2xl font-black text-[var(--text)] mb-4">Infrastructure Test</h1>
        
        <div className="space-y-2 mb-4">
          <Button variant="primary" onClick={testAll} fullWidth>
            Run All Tests
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={testStorageLoad}>
              Test Load
            </Button>
            <Button variant="ghost" onClick={testStorageSave}>
              Test Save
            </Button>
            <Button variant="ghost" onClick={testEventLog}>
              Test Event Log
            </Button>
            <Button variant="ghost" onClick={testTodayDoses}>
              Test Today Doses
            </Button>
            <Button variant="ghost" onClick={testNextDose}>
              Test Next Dose
            </Button>
            <Button variant="ghost" onClick={testMigration}>
              Test Migration
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Test Results</h2>
          <div className="bg-[var(--surface2)] rounded-lg p-3 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-[var(--muted2)]">No tests run yet</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <p key={index} className="text-xs font-mono text-[var(--text)]">
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Current State</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[var(--muted2)]">Schema Version:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.schemaVersion}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Profiles:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.profiles.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Active Profile:</span>{' '}
            <span className="text-[var(--text)] font-semibold">
              {state.profiles.find(p => p.id === state.activeProfileId)?.name || 'None'}
            </span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Medications:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.medications.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Schedules:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.schedules.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Inventory Items:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.inventory.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Events:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{state.events.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Today Doses:</span>{' '}
            <span className="text-[var(--text)] font-semibold">{todayDoses.length}</span>
          </div>
          <div>
            <span className="text-[var(--muted2)]">Next Dose:</span>{' '}
            <span className="text-[var(--text)] font-semibold">
              {nextDose ? new Date(nextDose.plannedTime).toLocaleTimeString() : 'None'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Recent Events</h2>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {state.events.slice(-10).reverse().map(event => (
            <div key={event.id} className="text-xs border-b border-[var(--stroke)] pb-1">
              <div className="flex justify-between">
                <span className="text-[var(--text)] font-semibold">{event.type}</span>
                <span className="text-[var(--muted2)]">
                  {new Date(event.ts).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[var(--muted2)]">
                Profile: {state.profiles.find(p => p.id === event.profileId)?.name || event.profileId}
              </div>
            </div>
          ))}
          {state.events.length === 0 && (
            <p className="text-sm text-[var(--muted2)]">No events yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}

