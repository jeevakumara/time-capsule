# IF3101 Academic Compliance Audit — UNIT V (Single Page Applications & React Architecture)

---

## 1. Unit 5 Concept Compliance Matrix

| Syllabus Topic | Status | File Location |
| :--- | :---: | :--- |
| **SPA Concepts & Building Blocks** | Fully Implemented | `client/src/main.tsx`, `client/src/App.tsx`, `client/vite.config.js` |
| **React Functional Components** | Fully Implemented | All 12 components/pages across `src/components/` and `src/pages/` |
| **JSX Syntax & Reusability** | Fully Implemented | `Avatar.tsx`, `DashboardLayout.tsx`, `LocationPickerMap.tsx` |
| **useState Hook** | Fully Implemented | `Login.tsx` (4 states), `CapsuleViewer.tsx` (4 states), `CreateCapsule.tsx` |
| **useEffect Hook** | Fully Implemented | `CapsuleViewer.tsx` (line 29), `CreateCapsule.tsx` (line 25), `EditUserModal.tsx` (line 23) |
| **useContext / Custom Hook** | Fully Implemented | `AuthContext.tsx` exports `useAuth()` — consumed in 4+ components |
| **useRef Hook** | Fully Implemented | `EditUserModal.tsx` line 21: `useRef<HTMLInputElement>(null)` |
| **useCallback Hook** | MISSING | Not found in any .tsx file across the codebase |
| **Forms & Controlled Inputs** | Fully Implemented | `Login.tsx` (email+password), `CreateCapsule.tsx` (multi-field), `EditUserModal.tsx` |
| **File Upload Handling** | Fully Implemented | `EditUserModal.tsx` (avatar), `CreateCapsule.tsx` (PDF), with size validation |
| **Client-Side Routing** | Fully Implemented | `App.tsx` — BrowserRouter, Routes, Route with 5 defined paths |
| **Dynamic Route Params** | Fully Implemented | `CapsuleViewer.tsx` line 23: `useParams<{ id: string }>()` |
| **Navigation Guards (ProtectedRoute)** | Fully Implemented | `components/ProtectedRoute.tsx` — role-based redirect with returnTo state |
| **useNavigate / useLocation** | Fully Implemented | `Login.tsx` (lines 13-14), `DashboardLayout.tsx` (line 16) |
| **Context API (State Management)** | Fully Implemented | `AuthContext.tsx` — createContext, AuthProvider, useAuth with localStorage sync |
| **Error Boundary** | MISSING | No class-based ErrorBoundary or react-error-boundary found |

---

## 2. Detailed Code Evidence Analysis

### SPA Entry Point & Virtual DOM
File: client/src/main.tsx (lines 7-10)
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );
CSR proof: Single HTML shell in index.html, all routing handled client-side by react-router-dom.

### Functional Components
| Component | Location | Purpose |
| Login | pages/Login.tsx | Authentication form with role-based redirect |
| CapsuleViewer | pages/CapsuleViewer.tsx | GPS-gated document unlock flow |
| CreateCapsule | pages/HRDashboard/CreateCapsule.tsx | Multi-field form with map + file input |
| DashboardLayout | components/DashboardLayout.tsx | Shared navbar/layout wrapper with slot |
| ProtectedRoute | components/ProtectedRoute.tsx | Role-gated navigation guard |
| LocationPickerMap | components/LocationPickerMap.tsx | Leaflet map with CoordinateTuple typing |
| Avatar | components/Avatar.tsx | Reusable image/initials avatar |
| EditUserModal | components/EditUserModal.tsx | Profile edit modal with file preview |

### Hooks Usage Summary
| Hook | File | Line | Purpose |
| useState | Login.tsx | 8-11 | email, password, error, isLoading |
| useState | CapsuleViewer.tsx | 24-27 | capsule, phase, errorMsg, pdfUrl |
| useEffect | CapsuleViewer.tsx | 29-46 | Fetch capsule on :id param change |
| useEffect | CreateCapsule.tsx | 25-39 | Load interviewers + capsules on mount |
| useEffect | EditUserModal.tsx | 23-31 | Reset form fields when modal opens |
| useRef | EditUserModal.tsx | 21 | fileInputRef for avatar upload trigger |
| useContext | AuthContext.tsx | 57-63 | useAuth() custom hook |
| useNavigate | DashboardLayout.tsx | 16 | Redirect after logout |
| useLocation | Login.tsx | 14 | Retrieve returnTo deep-link state |
| useParams | CapsuleViewer.tsx | 23 | Extract capsule :id from URL |

### Context API / State Management
File: client/src/context/AuthContext.tsx
- createContext<AuthContextType | undefined>(undefined) — typed context
- AuthProvider: manages user (useState), persists to localStorage
- login(), logout(), updateUser() — full CRUD over auth state
- useAuth() — custom hook exported and consumed in Login, DashboardLayout, ProtectedRoute, UserList

### Protected Route & Navigation Guard
File: client/src/components/ProtectedRoute.tsx
- Reads user from useAuth()
- If no user -> Navigate to /login with state={{ returnTo: location.pathname }}
- If wrong role -> Navigate to /login
- Wraps all 4 protected route groups in App.tsx

---

## 3. Gap Analysis & Implementation Plan

Two concepts are missing from the React architecture for 100% Unit 5 compliance:

### Gap 1: useCallback Hook — Not Used Anywhere
useCallback is a fundamental React performance hook that should be demonstrated
alongside useState and useEffect.

Fix: Add useCallback to client/src/components/LocationPickerMap.tsx
Wrap the existing onChange handler in useCallback to memoize it.

  import { useCallback } from "react";

  // Inside MapClickHandler component:
  const handleClick = useCallback((e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onChange({ latitude: lat, longitude: lng });
  }, [onChange]);

This is non-breaking — it adds memoization to an existing click handler.

### Gap 2: Error Boundary — Not Implemented
React Error Boundaries are a standard academic topic for SPA resilience.
They must be class-based components (cannot use hooks) or use react-error-boundary.

Fix: Create client/src/components/ErrorBoundary.tsx

  import { Component, ErrorInfo, ReactNode } from "react";

  interface ErrorBoundaryState { hasError: boolean; message: string; }
  interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }

  export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
      state: ErrorBoundaryState = { hasError: false, message: "" };

      static getDerivedStateFromError(error: Error): ErrorBoundaryState {
          return { hasError: true, message: error.message };
      }

      componentDidCatch(error: Error, info: ErrorInfo) {
          console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
      }

      render() {
          if (this.state.hasError) {
              return this.props.fallback ?? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                      <p className="text-red-700 font-semibold">Something went wrong.</p>
                      <p className="text-sm text-red-500 mt-1">{this.state.message}</p>
                  </div>
              );
          }
          return this.props.children;
      }
  }

Then wrap App content in client/src/App.tsx:
  import { ErrorBoundary } from "./components/ErrorBoundary";
  // Wrap <AuthProvider> with <ErrorBoundary>