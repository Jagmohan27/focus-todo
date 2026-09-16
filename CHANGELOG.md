# Changelog

All notable changes to the Focus Task Management project will be documented in this file.

## [1.0.0] - 2026-09-17

### Added
- **Custom Time Picker Modal:** Added interactive time selection popover with quick presets (*Morning 9 AM, Afternoon 1 PM, Evening 6 PM, Night 9 PM*), 12-hour/24-hour hour & minute selectors (5-min steps), and direct time input.
- **Due Date & Time Badges:** Dynamic time badge rendering with color-coded overdue and upcoming status indicators.
- **Accessibility Enhancements:** Added `role="dialog"`, ARIA labels, and `Escape` key event handling for popover dialogs.

### Performance
- **Vite Build Optimization:** Achieved **<350ms** build execution times.
- **React Component Memoization:** Memoized `FilterPill` and sub-components to eliminate unnecessary re-render cycles.
- **Offline Storage:** 100% client-side data persistence via `LocalStorage`.

### UI/UX & Motion
- **Framer Motion Physics:** Drag-and-drop task reordering and spring physics transitions.
- **Theme Support:** Dark/Light mode theme system with glassmorphism backdrop blur.
