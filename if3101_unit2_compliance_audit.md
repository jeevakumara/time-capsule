# IF3101 Academic Compliance Audit - UNIT II (Client Side Actions)

## 1. Unit 2 Concept Compliance Matrix

| Syllabus Topic | Status | File Location / Context |
| :--- | :--- | :--- |
| **React Framework & Core Concepts** | ✅ Fully Implemented | `client/src/main.tsx` (Vite, DOM rendering) |
| **Writing Different Components** | ✅ Fully Implemented | `client/src/components/LocationPickerMap.tsx`, `client/src/pages/InterviewerCapsules.tsx` |
| **Introduction to TypeScript in React** | ⚠️ Partially Implemented | Contexts (`AuthContext.tsx`) use `interface`, but component props and `.map()` iterations often use implicit `any`. |
| **Programming Structures** | ✅ Fully Implemented | `client/src/pages/InterviewerCapsules.tsx` (Conditional rendering, `.map()` for lists, ternary operators). |
| **Basic Data Types** | ✅ Fully Implemented | Extensively used in `useState` (strings, numbers, nulls, booleans). |
| **Arrays** | ✅ Fully Implemented | `const [capsules, setCapsules] = useState([])` and `capsules.map()` in list views. |
| **Tuples** | ❌ Missing | Arrays of coordinates like `[12.9481, 80.1397]` are used, but they lack explicit TypeScript `[number, number]` tuple typing. |
| **Enums** | ❌ Missing | User roles (`hr`) and capsule statuses (`unlocked`) are passed as hardcoded raw strings rather than strict TypeScript enums. |
| **Functions** | ✅ Fully Implemented | Async API calls (`requestLocationAndUnlock`), arrow functions, event handlers (`onChange`). |

---

## 2. Detailed Code Evidence Analysis

### React Framework, Components, & Structures
*   **File:** `client/src/main.tsx`
*   **Evidence:** Standard React 18 bootstrap using `ReactDOM.createRoot().render(<App />)`.
*   **File:** `client/src/pages/InterviewerCapsules.tsx`
*   **Evidence:** Demonstrates list rendering via `capsules.map((c: any) => ...)` (line 91), and conditional logic for rendering the map or error messages: `{error && <p>...}` (line 84).

### State Management & Arrays
*   **File:** `client/src/pages/InterviewerCapsules.tsx`
*   **Evidence:** `useState([])` (line 6) manages the array of fetched capsules. `useState("")` manages string primitives for errors and status.
*   **File:** `client/src/context/AuthContext.tsx`
*   **Evidence:** Proper React Context implementation `const AuthContext = createContext<AuthContextType | undefined>(undefined);` demonstrating advanced React state flow.

---

## 3. Gap Analysis & Implementation Plan

To achieve 100% strict academic compliance with the IF3101 Unit 2 syllabus, the frontend must explicitly demonstrate the missing TypeScript primitives: **Enums**, **Tuples**, and strict **Prop Interfaces** for functional components.

The following isolated code updates will fulfill all remaining requirements.

### Gap 1: Missing TypeScript Enums
*Currently, user roles and capsule statuses are handled as raw strings. The syllabus requires demonstrating `enum`.*

**Implementation Code:** Create a new shared types file at `client/src/types/enums.ts`:
```typescript
// client/src/types/enums.ts
export enum UserRole {
    HR = 'hr',
    INTERVIEWER = 'interviewer',
    ADMIN = 'admin'
}

export enum CapsuleStatus {
    LOCKED = 'locked',
    UNLOCKED = 'unlocked',
    EXPIRED = 'expired'
}
```
*(These enums can then optionally be imported into `AuthContext.tsx` and `InterviewerCapsules.tsx`.)*

### Gap 2: Explicit Tuple Usage & Missing Component Interfaces
*The `LocationPickerMap` component takes loosely typed props and uses a raw array for coordinates. It needs explicit TS Interfaces and a Tuple type.*

**Implementation Code:** Update `client/src/components/LocationPickerMap.tsx` to include strict typing.
```typescript
// client/src/components/LocationPickerMap.tsx (Updated)
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";

// 1. Explicit Tuple Definition
type CoordinateTuple = [number, number];

// 2. Strict Prop Interfaces
interface MapClickProps {
    onChange: (coords: { latitude: number; longitude: number }) => void;
}

interface LocationPickerProps {
    latitude?: number | string | null;
    longitude?: number | string | null;
    radiusMeters?: number | string;
    onChange: (coords: { latitude: number; longitude: number }) => void;
}

function MapClickHandler({ onChange }: MapClickProps) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onChange({ latitude: lat, longitude: lng });
        },
    });
    return null;
}

function LocationPickerMap({ latitude, longitude, radiusMeters, onChange }: LocationPickerProps) {
    // 3. Applying the Tuple Type
    const defaultCenter: CoordinateTuple = [12.9481, 80.1397]; // MIT default center
    const center: CoordinateTuple =
        latitude != null && longitude != null
            ? [Number(latitude), Number(longitude)]
            : defaultCenter;

    const radius = radiusMeters ? Number(radiusMeters) : 100;

    return (
        <MapContainer center={center} zoom={17} style={{ height: "300px", width: "100%", marginBottom: "1rem" }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onChange={onChange} />
            {latitude != null && longitude != null && (
                <>
                    <Marker position={[Number(latitude), Number(longitude)]} />
                    <Circle center={[Number(latitude), Number(longitude)]} radius={radius} pathOptions={{ color: "blue", fillColor: "#3f8efc", fillOpacity: 0.2 }} />
                </>
            )}
        </MapContainer>
    );
}

export default LocationPickerMap;
```
