# AI Rules & Guidelines

This document outlines the technical stack and development rules for the AgendaPro application.

## Tech Stack

- **Frontend Framework:** React 19+ (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM (v6/v7)
- **Backend / Database:** Supabase (PostgreSQL + Auth)
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React Context API (`src/store.tsx` & `src/context/AuthContext.tsx`)

## Development Rules

### 1. Styling & UI
- **Tailwind First:** Always use Tailwind CSS utility classes for styling. Avoid creating new CSS files or `style` blocks unless absolutely necessary for complex animations or browser-specific hacks.
- **Responsive Design:** All components must be mobile-responsive by default. Use Tailwind's responsive prefixes (e.g., `md:flex`, `lg:grid-cols-3`).
- **Icons:** exclusively use `lucide-react` for icons.

### 2. State Management & Data Fetching
- **Context API:** Use the existing `AppProvider` (in `src/store.tsx`) for global application state (appointments, services, professionals, etc.).
- **Supabase:**
  - Use the exported `supabase` client from `src/lib/supabase.ts`.
  - Perform database operations directly within the Context providers or custom hooks.
  - Do NOT introduce other state libraries like Redux or Zustand.

### 3. Components & Structure
- **File Naming:** Use PascalCase for component files (e.g., `UserProfile.tsx`) and camelCase for hooks/utils (e.g., `useAuth.ts`).
- **Directory Structure:**
  - `src/pages/*`: Route components / views.
  - `src/components/*`: Reusable UI components.
  - `src/lib/*`: Configuration and library clients (e.g., Supabase).
  - `src/types.ts`: Shared TypeScript interfaces.
- **Functional Components:** Always use functional components with Hooks.

### 4. Routing
- **Centralized Routes:** Keep all route definitions in `src/App.tsx`.
- **Navigation:** Use the `Link` component for internal navigation and `useNavigate` hook for programmatic navigation.
- **Protection:** Use the `PrivateRoute` and `AdminRoute` wrappers in `App.tsx` to secure authenticated routes.

### 5. Type Safety
- **Strict Typing:** Avoid using `any`. Define interfaces for all data structures in `src/types.ts` or locally if the type is component-specific.
- **Props:** Define prop interfaces for all components.

### 6. Forms
- **Controlled Components:** Use React's `useState` for form handling.
- **Validation:** Implement simple client-side validation before sending data to Supabase.