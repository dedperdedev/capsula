# UI Refresh V1 - Calm Medical Design

## Overview

This document describes the UI refresh implemented to create a calmer, more iOS-like medical app experience while preserving all existing functionality.

## Changes Made

### Phase 0: Safety Rails
- ✅ Added `uiRefreshV1` feature flag for safe rollback
- ✅ Default enabled, can be disabled via Settings → Feature Flags

### Phase 1: Calm Today Header
- ✅ New `TodayHeaderV2` component with:
  - Profile avatar + name on the left
  - Progress ring (SVG) showing adherence percentage
  - Primary message: "X of Y medications you took today"
  - Subtle helper text: "Don't forget to enter the rest"
  - Date navigation with chevrons
  - Notification bell icon
  - Soft gradient background

### Phase 2: Softer Dose Cards
- ✅ Enhanced `DoseCard` component:
  - Larger icon (14x14 → 56x56px) as primary visual anchor
  - Softer backgrounds with tinted status colors (green/red/blue)
  - Larger checkbox (22px → 44px) for better tap targets
  - More whitespace and padding
  - Rounded corners increased (18px → 20px)
  - Subtle hover and active states
  - Reduced visual noise (fewer borders, muted colors)

- ✅ Updated `TimeGroup`:
  - Cleaner time header (removed dot indicator)
  - More spacing between dose cards (2 → 3)
  - Softer "Mark All" button styling

## How to Rollback

If issues are found, the UI refresh can be disabled:

1. **Via Settings UI** (when implemented):
   - Go to Settings → Feature Flags
   - Toggle "UI Refresh V1" off

2. **Via Browser Console**:
   ```javascript
   localStorage.setItem('capsula_feature_flags', JSON.stringify({
     ...JSON.parse(localStorage.getItem('capsula_feature_flags') || '{}'),
     uiRefreshV1: false
   }));
   location.reload();
   ```

3. **Via Code**:
   - Edit `src/lib/featureFlags.ts`
   - Set `uiRefreshV1: false` in `DEFAULT_FLAGS`

## Design Principles

1. **Calm over loud**: Softer colors, more whitespace, reduced visual noise
2. **Hierarchy**: Larger icons, clearer primary actions
3. **Touch-friendly**: Minimum 44px tap targets (iOS HIG)
4. **Accessibility**: Maintained ARIA labels, keyboard navigation
5. **Functionality preserved**: All existing actions work identically

## Testing Checklist

- [x] Build passes (`npm run build`)
- [x] TypeScript checks pass
- [ ] Manual testing: Take/Skip/Postpone actions work
- [ ] Manual testing: Swipe gestures work
- [ ] Manual testing: Batch mark works
- [ ] Manual testing: Profile switching works
- [ ] Manual testing: Dark mode looks good
- [ ] Manual testing: Date navigation works
- [ ] Manual testing: Deep links still work
- [ ] Manual testing: Export/Import works

## Next Steps (Future Phases)

- Phase 3: Simple vs Advanced view toggle
- Phase 4: Medicine Details passport-style layout
- Phase 5: Theme token polish

## Notes

- Old `TodayProgressCard` is hidden when new header is active
- NextDoseCard is hidden when new header is active (may be re-added later)
- All event logging and state management unchanged
- No storage migrations needed (feature flag only)
