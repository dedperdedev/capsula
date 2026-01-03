/**
 * Backup/Export/Import functionality
 */

import { loadAppState, saveAppState, appendEvent, type AppState, CURRENT_SCHEMA_VERSION } from './storage';

export interface BackupData {
  exportDate: string;
  appVersion: string;
  schemaVersion: number;
  data: AppState;
}

/**
 * Export all data as JSON
 */
export function exportData(): BackupData {
  const state = loadAppState();
  
  return {
    exportDate: new Date().toISOString(),
    appVersion: '0.2.0',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    data: state,
  };
}

/**
 * Download export as JSON file
 */
export function downloadBackup(): void {
  const backup = exportData();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `capsula-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate backup data
 */
export function validateBackup(data: unknown): { valid: boolean; error?: string; preview?: BackupPreview } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid backup format' };
  }

  const backup = data as Record<string, unknown>;

  if (!backup.schemaVersion || typeof backup.schemaVersion !== 'number') {
    return { valid: false, error: 'Missing or invalid schema version' };
  }

  if (backup.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { valid: false, error: `Backup version (${backup.schemaVersion}) is newer than app version (${CURRENT_SCHEMA_VERSION})` };
  }

  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: 'Missing data' };
  }

  const appData = backup.data as Record<string, unknown>;

  const preview: BackupPreview = {
    exportDate: backup.exportDate as string || 'Unknown',
    schemaVersion: backup.schemaVersion,
    profileCount: Array.isArray(appData.profiles) ? appData.profiles.length : 0,
    medicationCount: Array.isArray(appData.medications) ? appData.medications.length : 0,
    scheduleCount: Array.isArray(appData.schedules) ? appData.schedules.length : 0,
    eventCount: Array.isArray(appData.events) ? appData.events.length : 0,
    inventoryCount: Array.isArray(appData.inventory) ? appData.inventory.length : 0,
  };

  return { valid: true, preview };
}

export interface BackupPreview {
  exportDate: string;
  schemaVersion: number;
  profileCount: number;
  medicationCount: number;
  scheduleCount: number;
  eventCount: number;
  inventoryCount: number;
}

/**
 * Import backup data (replace mode)
 */
export function importData(backup: BackupData): { success: boolean; error?: string } {
  try {
    const validation = validateBackup(backup);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const currentState = loadAppState();
    const newState = backup.data;

    // Update schema version
    newState.schemaVersion = CURRENT_SCHEMA_VERSION;

    // Save the new state
    saveAppState(newState);

    // Log import event
    appendEvent({
      profileId: newState.activeProfileId || 'system',
      ts: new Date().toISOString(),
      type: 'DATA_IMPORTED',
      metadata: {
        exportDate: backup.exportDate,
        previousProfiles: currentState.profiles.length,
        importedProfiles: newState.profiles.length,
        previousEvents: currentState.events.length,
        importedEvents: newState.events.length,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Merge backup data with existing data
 */
export function mergeData(backup: BackupData): { success: boolean; error?: string; merged?: MergeResult } {
  try {
    const validation = validateBackup(backup);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const currentState = loadAppState();
    const importState = backup.data;

    const merged: MergeResult = {
      profiles: { added: 0, existing: 0 },
      medications: { added: 0, existing: 0 },
      schedules: { added: 0, existing: 0 },
      events: { added: 0, existing: 0 },
      inventory: { added: 0, existing: 0 },
    };

    // Merge profiles
    for (const profile of importState.profiles) {
      const exists = currentState.profiles.find(p => p.id === profile.id);
      if (!exists) {
        currentState.profiles.push(profile);
        merged.profiles.added++;
      } else {
        merged.profiles.existing++;
      }
    }

    // Merge medications
    for (const med of importState.medications) {
      const exists = currentState.medications.find(m => m.id === med.id);
      if (!exists) {
        currentState.medications.push(med);
        merged.medications.added++;
      } else {
        merged.medications.existing++;
      }
    }

    // Merge schedules
    for (const schedule of importState.schedules) {
      const exists = currentState.schedules.find(s => s.id === schedule.id);
      if (!exists) {
        currentState.schedules.push(schedule);
        merged.schedules.added++;
      } else {
        merged.schedules.existing++;
      }
    }

    // Merge events (by ID to avoid duplicates)
    for (const event of importState.events) {
      const exists = currentState.events.find(e => e.id === event.id);
      if (!exists) {
        currentState.events.push(event);
        merged.events.added++;
      } else {
        merged.events.existing++;
      }
    }

    // Merge inventory
    for (const inv of importState.inventory) {
      const exists = currentState.inventory.find(i => i.id === inv.id);
      if (!exists) {
        currentState.inventory.push(inv);
        merged.inventory.added++;
      } else {
        merged.inventory.existing++;
      }
    }

    // Save merged state
    saveAppState(currentState);

    return { success: true, merged };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface MergeResult {
  profiles: { added: number; existing: number };
  medications: { added: number; existing: number };
  schedules: { added: number; existing: number };
  events: { added: number; existing: number };
  inventory: { added: number; existing: number };
}

/**
 * Reset all data
 */
export function resetAllData(): void {
  localStorage.removeItem('capsula_app_state');
  // Also remove old format data
  localStorage.removeItem('capsula_items');
  localStorage.removeItem('capsula_schedules');
  localStorage.removeItem('capsula_dose_logs');
  localStorage.removeItem('capsula_inventory');
  localStorage.removeItem('capsula.theme');
  localStorage.removeItem('capsula.locale');
  localStorage.removeItem('capsula.cabinet');
  localStorage.removeItem('capsula.search.recent');
}

/**
 * Generate print-friendly report (last 30 days)
 */
export function generateReport(profileId: string, days: number = 30): string {
  const state = loadAppState();
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return '';

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const relevantEvents = state.events.filter(e => 
    e.profileId === profileId &&
    new Date(e.ts) >= cutoffDate &&
    (e.type === 'DOSE_TAKEN' || e.type === 'DOSE_SKIPPED' || e.type === 'DOSE_POSTPONED')
  );

  const takenCount = relevantEvents.filter(e => e.type === 'DOSE_TAKEN').length;
  const skippedCount = relevantEvents.filter(e => e.type === 'DOSE_SKIPPED').length;
  const postponedCount = relevantEvents.filter(e => e.type === 'DOSE_POSTPONED').length;
  const total = takenCount + skippedCount + postponedCount;
  const adherence = total > 0 ? Math.round((takenCount / total) * 100) : 0;

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчет о приеме лекарств - ${profile.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .stat { display: inline-block; margin-right: 30px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .taken { color: #22c55e; }
    .skipped { color: #ef4444; }
    .postponed { color: #3b82f6; }
    @media print { body { print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>Отчет о приеме лекарств</h1>
  <p><strong>Профиль:</strong> ${profile.name}</p>
  <p><strong>Период:</strong> ${cutoffDate.toLocaleDateString('ru-RU')} - ${new Date().toLocaleDateString('ru-RU')}</p>
  <p><strong>Сгенерировано:</strong> ${new Date().toLocaleString('ru-RU')}</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-value">${adherence}%</div>
      <div class="stat-label">Адгеренс</div>
    </div>
    <div class="stat">
      <div class="stat-value taken">${takenCount}</div>
      <div class="stat-label">Принято</div>
    </div>
    <div class="stat">
      <div class="stat-value skipped">${skippedCount}</div>
      <div class="stat-label">Пропущено</div>
    </div>
    <div class="stat">
      <div class="stat-value postponed">${postponedCount}</div>
      <div class="stat-label">Перенесено</div>
    </div>
  </div>

  <h2>История приемов</h2>
  <table>
    <thead>
      <tr>
        <th>Дата/Время</th>
        <th>Действие</th>
        <th>Препарат</th>
        <th>Примечание</th>
      </tr>
    </thead>
    <tbody>
      ${relevantEvents.slice(0, 100).map(e => {
        const med = state.medications.find(m => m.id === e.entityId);
        const actionClass = e.type === 'DOSE_TAKEN' ? 'taken' : e.type === 'DOSE_SKIPPED' ? 'skipped' : 'postponed';
        const actionText = e.type === 'DOSE_TAKEN' ? 'Принято' : e.type === 'DOSE_SKIPPED' ? 'Пропущено' : 'Перенесено';
        return `
          <tr>
            <td>${new Date(e.ts).toLocaleString('ru-RU')}</td>
            <td class="${actionClass}">${actionText}</td>
            <td>${med?.name || '-'}</td>
            <td>${e.metadata.reason || e.metadata.postponePreset || '-'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  return html;
}

/**
 * Open report in new window for printing
 */
export function printReport(profileId: string, days: number = 30): void {
  const html = generateReport(profileId, days);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

