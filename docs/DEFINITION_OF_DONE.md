# Definition of Done — Capsula

## Checklist for Every Feature

### 1. Code Quality
- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] No ESLint errors or warnings
- [ ] Code follows project conventions (CSS variables, component structure)
- [ ] No hardcoded strings (use i18n)
- [ ] No unused imports or variables

### 2. Functionality
- [ ] Feature works as specified
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Works offline (data persists in localStorage)
- [ ] Works with demo data
- [ ] Works with fresh install (no data)

### 3. User Experience
- [ ] Responsive design (320px - 430px width)
- [ ] Touch-friendly (min 44x44px tap targets)
- [ ] Visual feedback on actions (loading, success, error)
- [ ] Animations are smooth (60fps)
- [ ] Works in both light and dark themes

### 4. Data Integrity
- [ ] State changes are persisted
- [ ] Checksum protection active
- [ ] Backup created before destructive operations
- [ ] Migration tested from previous version
- [ ] ErrorBoundary catches failures

### 5. Testing
- [ ] Unit tests pass (if applicable)
- [ ] Manual testing in Chrome/Safari
- [ ] Tested on mobile device (or emulator)
- [ ] Deep links work after refresh
- [ ] PWA install works (production build)

### 6. Documentation
- [ ] Code comments for complex logic
- [ ] README updated if needed
- [ ] CHANGELOG entry added
- [ ] Type definitions are accurate

---

## Feature-Specific Checklists

### Adding a New Page
- [ ] Route added in `App.tsx`
- [ ] Navigation added in `BottomNav.tsx` (if main page)
- [ ] TopBar configured with proper title
- [ ] Page wrapped in Shell component
- [ ] Translations added for all strings

### Adding a New Component
- [ ] Props interface defined
- [ ] Default props where sensible
- [ ] Uses CSS variables for theming
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Exported from appropriate index file

### Adding a New Hook
- [ ] TypeScript types for all parameters and returns
- [ ] Cleanup on unmount (if subscriptions/timers)
- [ ] Memoization where appropriate
- [ ] Error handling for async operations

### Modifying Data Layer
- [ ] Schema version bumped if structure changes
- [ ] Migration function written
- [ ] Backward compatibility verified
- [ ] Event logged for audit trail
- [ ] Inventory impact calculated

### Modifying Dose Logic
- [ ] Grace window respected
- [ ] Timing status updated correctly
- [ ] Collision detection for postpone
- [ ] PRN limits enforced (if applicable)
- [ ] Snooze logic preserves original time

---

## Quality Gates

### Before Commit
```bash
npm run lint          # No errors
npm run typecheck     # No errors
npm run build         # Succeeds
```

### Before PR Merge
- All checks above pass
- Manual testing complete
- Code reviewed by at least one person
- No regressions in existing features

### Before Release
- All features complete per roadmap
- E2E tests pass (when implemented)
- Performance audit (Lighthouse > 90)
- Accessibility audit (no critical issues)
- Production build deployed to staging
- Smoke test on real device

---

## Common Pitfalls to Avoid

1. **Forgetting theme variables** — Always use `var(--text)`, `var(--surface)`, etc.
2. **Hardcoded Russian** — All user-facing strings must use `t()` or locale check
3. **Missing error handling** — Wrap localStorage access in try/catch
4. **Forgetting mobile** — Test with 375px viewport
5. **Breaking deep links** — Test `/capsula/today` direct access
6. **Ignoring offline** — Test with DevTools offline mode
7. **Losing data on refresh** — Verify localStorage persistence
8. **Missing loading states** — Show skeleton or spinner for async ops

---

## Release Versioning

We follow Semantic Versioning:
- **MAJOR** (1.x.x): Breaking changes to data format
- **MINOR** (x.1.x): New features
- **PATCH** (x.x.1): Bug fixes

Current Version: **0.2.0**
