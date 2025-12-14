
# Coding Standards

## 1. General Principles
*   **KISS**: Keep it Simple, Stupid. No over-engineering.
*   **Visual First**: The UI is a key differentiator. Prioritize aesthetics and responsiveness.
*   **Type Safety**: No `any` unless interacting with untyped 3rd party libraries (like FaceAPI CDN).

## 2. React Patterns
*   **Composition**: Use `children` prop for layout wrappers (e.g., `NeoCard`, `NeoModal`).
*   **Custom Hooks**: Extract logic into `services/` or hooks if it exceeds 20 lines or is reused.
*   **Rendering**: Avoid heavy computations in render. Use `useMemo` for derived data (like Payroll calculations).

## 3. Tailwind CSS Strategy
*   **Utility First**: Use utility classes for layout (flex, grid, spacing).
*   **Colors**: Use semantic colors defined in `tailwind.config` (e.g., `neo-blue`, `neo-yellow`).
*   **Arbitrary Values**: Permitted for specific "Neo-Brutalist" effects (e.g., `shadow-[4px_4px_0_0_#000]`).

## 4. Naming Conventions
*   **Components**: PascalCase (`Dashboard.tsx`).
*   **Functions/Vars**: camelCase (`calculatePayroll`).
*   **Types**: PascalCase (`Employee`).
*   **Constants**: UPPER_SNAKE_CASE (`DEFAULT_LAYOUT`).

## 5. Security (Client-Side)
*   Never store real API keys in client-side code (use `.env` and assume they are public if not proxied). *Note: For this demo, client-side API key usage is accepted.*
*   Sanitize user inputs before rendering to prevent XSS (React does this by default, but be careful with `dangerouslySetInnerHTML`).
