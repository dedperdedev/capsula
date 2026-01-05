# Capsula Features

## Core Features

### 📅 Today (Dashboard)
- **Grouped doses**: Medications organized by time slots
- **Progress card**: Visual summary of taken/skipped/postponed/remaining
- **Next Dose card**: Prominent display of next upcoming/overdue dose with quick actions
- **Batch mark**: Mark all doses in a time slot at once
- **Swipe gestures**: One-tap interactions (swipe left=taken, right=postpone, down=skip)
- **Routine anchors**: Schedule doses relative to wake/meal/bed times
- **Color-coded statuses**: Green (taken), Red (skipped), Blue (postponed), Gray (pending)
- **Grace window**: Configurable time window for on-time vs late tracking (default: 60 min)

### 💊 Dose Actions (DoseDueModal)
- **Take**: Mark dose as taken, auto-decrement inventory
- **Skip**: Choose from predefined reasons (forgot, unavailable, felt bad, other)
- **Postpone**: Preset options (+10min, +30min, +1h, +2h) or custom time
- **Collision detection**: Warning when postponing creates overlapping doses
- **Undo**: Revert last action within timeout

### 📆 Schedules
- **Multiple scheme types**:
  - Daily (X times per day)
  - Weekly (specific weekdays)
  - Interval days (every N days)
  - Interval hours (every N hours)
  - Course (N days total)
  - PRN (as-needed with limits)
- **Routine anchors**: Schedule relative to wake/breakfast/lunch/dinner/bed times
- **Configurable settings**: Start/end dates, food relation, grace window
- **DST handling**: LOCAL_TIME or ABSOLUTE_UTC policy
- **Travel mode**: Keep original timezone when traveling

### 📦 Library & Inventory
- **Medication catalog**: Add, edit, delete medications
- **Inventory tracking**: Remaining units, auto-decrement on take
- **Low stock alerts**: Configurable threshold warnings
- **"Enough until" forecast**: Predict when medication runs out
- **Refill reminders**: Automatic alerts based on forecast

### 📊 Insights & Analytics
- **Adherence breakdown**: Taken rate, on-time rate, late rate
- **Skip reasons**: Breakdown of why doses were skipped
- **Heatmap**: Day × hour grid showing problem patterns
- **Problem times**: Top 5 times with most missed/late doses
- **Per-medication stats**: Adherence by individual medication
- **Weekly trends**: Day-by-day adherence chart
- **Achievements**: Streak tracking, badges (7-day, 30-day, 100 doses)

### 🔍 Drug Search & Details
- **Smart search**: By name, manufacturer, form
- **Autocomplete**: Dropdown with keyboard navigation
- **Drug details page**: Full information, characteristics, instructions
- **Active ingredient check**: Warns about duplicate ingredients
- **Add to cabinet**: Quick addition from search

### 👤 Multi-Profile Support
- **Multiple profiles**: For family members
- **Profile switching**: Quick switch in header
- **Isolated data**: Each profile has separate schedules/inventory
- **Profile customization**: Name and color

---

## New Features (v0.2)

### 🛡️ Guardian Mode (Caregiver Alerts)
- **Guardian mode toggle**: Per-profile setting
- **Missed dose detection**: Alerts when dose exceeds grace + follow-up window
- **Care Alert banner**: Prominent display on Today screen
- **Push notifications**: Strong "Missed dose" alerts (when app is open)
- **Configurable follow-up**: +10, +30, +60 minutes, max repeats

### 📓 Symptom Diary & Measurements
- **Symptom logging**: 9 predefined types + severity (1-10) + notes
- **Measurement tracking**: Blood pressure, glucose, weight, temperature, heart rate, SpO2
- **Timeline view**: Chronological display of all entries
- **Medication linking**: Associate symptoms with specific doses
- **Correlation view**: Show symptoms occurring within 24h of taking medication
- **Filter by medication**: Focus on specific drug-related symptoms

### 📤 Export Options
- **CSV history**: Download dose events (date, time, medication, status, reason)
- **ICS calendar**: Export schedule to calendar apps (with reminders)
- **Encrypted JSON**: Password-protected backup using AES-GCM

### 🔒 Privacy & Security
- **App lock**: 4-digit PIN with PBKDF2 hashing
- **Auto-lock**: Configurable timeout (immediate, X minutes)
- **Emergency export**: Access backup even when locked
- **Encrypted backups**: Optional password protection for exports

### ⚗️ Drug Safety Checks
- **Duplicate ingredient detection**: Warns when adding medication with same active ingredient
- **Known interaction warnings**: Checks against interaction database (expanding)
- **Informational only**: Clear disclaimers about consulting clinicians

### 💊 Refill Reminders
- **Automatic detection**: Based on "enough until" forecast
- **Threshold setting**: Days before running out to alert
- **Banner on Today/Library**: Actionable "Refill soon" with quick add stock
- **Push notifications**: While app is open

---

## Technical Features

### 💾 Data Management
- **Event sourcing**: All actions logged as events
- **Versioned storage**: Schema migrations for updates
- **Checksum validation**: Detect storage corruption
- **Auto-backup**: Before each write
- **Manual backup/restore**: Export and import JSON

### 📱 PWA Support
- **Installable**: Add to home screen
- **Offline capable**: Service worker caching
- **Push notifications**: With action buttons (take/skip/postpone)

### 🔗 Deep Linking
- **SPA routing**: Works with direct URL access
- **404 redirect**: GitHub Pages compatibility

### 🌐 Internationalization
- **Languages**: Russian, English
- **Themes**: Light, Dark

---

## Planned Features

- [ ] Performance indexing for large event logs
- [ ] E2E tests with Playwright
- [ ] "Fast start" onboarding flow
- [ ] More interaction database coverage
- [ ] Cloud sync (optional)

