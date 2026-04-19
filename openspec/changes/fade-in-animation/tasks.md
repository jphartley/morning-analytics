## 1. Animation Definition

- [x] 1.1 Add `@keyframes fadeInUp` to `app/app/globals.css` (opacity 0→1, translateY 8px→0, 300ms ease-out)
- [x] 1.2 Register `animate-fade-in-up` utility in Tailwind theme config (via `@theme inline` block in globals.css)
- [x] 1.3 Add `prefers-reduced-motion: reduce` media query to disable the animation for accessibility

## 2. Component Integration

- [x] 2.1 Add `animate-fade-in-up` class to the AnalysisPanel root `<div>` wrapper
- [x] 2.2 Add `animate-fade-in-up` class to the ImageGrid root `<div>` wrapper

## 3. Validation

- [x] 3.1 Run `npm run build --prefix app` and `npm run lint --prefix app` with no errors
