# Privacy & Security

## Data Storage

### Local-Only Storage

Capsula stores all data locally in your browser's localStorage. **No data is sent to any server.**

- All medications, schedules, doses, and personal information stay on your device
- No accounts, no cloud sync, no tracking
- Data persists only in your current browser

### What We Store

| Data Type | Purpose | Sensitive |
|-----------|---------|-----------|
| Profiles | User identity | Low |
| Medications | Tracking what you take | Medium |
| Schedules | When to take | Low |
| Dose events | Adherence history | Medium |
| Symptoms | Health diary | High |
| Measurements | Vitals | High |
| Settings | Preferences | Low |

---

## Security Features

### App Lock (PIN)

When enabled, Capsula requires a 4-digit PIN to access:

**How it works:**
1. PIN is never stored in plain text
2. We use PBKDF2 with 100,000 iterations + salt
3. Only a cryptographic hash is stored

**Security notes:**
- PIN protects against casual access
- Not a substitute for device encryption
- 5 failed attempts triggers temporary lockout

**Emergency access:**
- Even when locked, you can export encrypted backup
- This allows data recovery if PIN is forgotten

### Encrypted Exports

Optional password protection for backup files:

**Encryption specs:**
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 with 100,000 iterations
- Random salt and IV per export

**Limitations:**
- Password strength determines security
- If password is forgotten, backup is unrecoverable
- Export file contains version, salt, IV (not the password)

---

## Data Integrity

### Checksum Validation

Every save includes a checksum to detect corruption:
- Uses DJB2 hash algorithm
- Verified on every load
- Automatic recovery from backup if mismatch

### Backup Strategy

1. **Auto-backup**: Before each write, current valid state is backed up
2. **Manual backup**: Download JSON file anytime
3. **Recovery**: Restore from backup if main storage corrupts

---

## Notification Limitations

### Web Push Notifications

Capsula uses Web Push API for reminders:

**What works:**
- Notifications when app is open/visible
- Action buttons (Take/Skip/Postpone)
- Custom sounds and vibration

**Limitations:**
- ⚠️ No guaranteed background delivery
- ⚠️ Browser must be running
- ⚠️ Some browsers restrict notifications
- ⚠️ iOS Safari has limited support

**Recommendation:**
For critical medications, combine with phone alarms.

---

## Data Access

### Who Can Access Your Data

| Party | Access | Notes |
|-------|--------|-------|
| You | Full | Via app or export |
| Other users of device | If no PIN | Use device-level security |
| Website owner | None | No server communication |
| Browser extensions | Potential | Use trusted extensions only |

### How to Delete Data

1. **In-app**: Settings → Clear All Data
2. **Browser**: Clear site data / localStorage
3. **Uninstall**: Remove PWA from device

---

## Best Practices

### Recommended Security Setup

1. ✅ Enable PIN lock
2. ✅ Set auto-lock timeout
3. ✅ Regular encrypted backups
4. ✅ Use device passcode/biometrics
5. ✅ Keep browser updated

### Backup Recommendations

1. Export encrypted backup weekly
2. Store backups in secure location (not same device)
3. Test restore occasionally
4. Use strong, unique passwords for encrypted exports

---

## Legal Disclaimers

### Medical Information

Capsula is a reminder and tracking tool, **not medical advice**:

- Drug information is for reference only
- Interaction checks are informational
- Symptom correlations are not diagnoses
- Always consult healthcare providers

### Data Responsibility

You are responsible for:
- Backup of your data
- Security of your device
- Strength of PIN/passwords
- Accuracy of entered information

We cannot:
- Recover lost data without backup
- Access your data in any way
- Guarantee notification delivery
- Provide medical guidance

