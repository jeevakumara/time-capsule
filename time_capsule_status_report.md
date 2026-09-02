# Time Capsule — Codebase Status Report
> Generated: 2026-09-02 | Workspace: `d:\time-capsule`

---

## 1. Architecture & Setup

### Monorepo Top-Level Structure
```
time-capsule/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── package.json     # Root workspace config
└── .gitignore
```

### `server/` Directory
```
server/
├── app.js                  # Express app factory (routes, middleware)
├── server.js               # Entry point (listen)
├── .env                    # Environment variables
├── config/
│   └── db.js               # Mongoose connection
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── capsuleController.js
│   ├── notificationController.js
│   └── auditController.js
├── middleware/
│   └── authMiddleware.js   # protect + authorize
├── models/
│   ├── User.js
│   ├── Capsule.js
│   ├── Notification.js
│   └── AuditLog.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── capsuleRoutes.js
│   ├── notificationRoutes.js
│   └── auditRoutes.js
├── services/
│   ├── notificationService.js  # Nodemailer + DB notification
│   └── auditService.js
├── utils/
│   ├── encryption.js       # AES-256-CBC encrypt/decrypt
│   ├── multerConfig.js     # PDF upload via multer
│   ├── distance.js         # Haversine GPS distance calc
│   ├── generateToken.js    # JWT signing
│   └── seedAdmin.js        # Admin seed script
└── uploads/                # Encrypted file storage directory
```

### `client/` Directory
```
client/
├── index.html
├── vite.config.js
├── src/
│   ├── App.jsx             # Router + ProtectedRoute definitions
│   ├── main.jsx            # React root mount
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state (user, login, logout)
│   ├── components/
│   │   ├── ProtectedRoute.jsx       # Role-gated route wrapper
│   │   └── LocationPickerMap.jsx    # Leaflet map for GPS selection
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── UserList.jsx
│   │   ├── CreateUser.jsx
│   │   ├── CreateCapsule.jsx
│   │   └── InterviewerCapsules.jsx
│   └── services/
│       ├── api.js           # Axios instance + JWT interceptor
│       ├── capsuleService.js
│       └── userService.js
```

---

## 2. Core Dependencies

### `server/package.json`
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP framework |
| `mongoose` | ^9.9.1 | MongoDB ODM |
| `bcrypt` | ^6.0.0 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT creation & verification |
| `multer` | ^2.2.0 | Multipart file uploads |
| `nodemailer` | ^9.0.4 | Email notifications |
| `dotenv` | ^17.4.2 | Environment variable loading |
| `cors` | ^2.8.6 | CORS headers |
| `nodemon` (dev) | ^3.1.14 | Auto-restart in dev |
> **Note:** No explicit `crypto` dependency — Node.js built-in `crypto` module is used for AES encryption.

### `client/package.json`
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.8 | UI framework |
| `react-dom` | ^19.2.8 | React DOM renderer |
| `react-router-dom` | ^7.18.2 | Client-side routing |
| `axios` | ^1.19.0 | HTTP client |
| `leaflet` | ^1.9.4 | Interactive maps |
| `react-leaflet` | ^5.0.0 | React bindings for Leaflet |
| `vite` (dev) | ^8.2.0 | Build tool / dev server |

---

## 3. Database Models

### Models defined in `server/models/`

#### `User.js` ✅
```js
{
  name:         String (required, trim)
  email:        String (required, unique, lowercase)
  employeeId:   String (unique, sparse)
  passwordHash: String (required)           // ✅ CONFIRMED
  role:         enum ["admin", "hr", "interviewer"] (required) // ✅ CONFIRMED
  status:       enum ["active", "disabled"] (default: "active")
  // _id:        auto-generated MongoDB ObjectId  ✅ CONFIRMED (Mongoose default)
  timestamps:   createdAt, updatedAt
}
```

#### `Capsule.js` ✅
```js
{
  title:              String (required, trim)
  description:        String (trim)
  senderId:           ObjectId → ref: "User" (required)
  receiverId:         ObjectId → ref: "User" (required)
  encryptedFilePath:  String (required)   // path to AES-encrypted file on disk
  fileName:           String (required)   // original filename
  latitude:           Number (required)   // GPS unlock point
  longitude:          Number (required)
  radiusMeters:       Number (default: 100)
  unlockTime:         Date (required)     // time-lock
  expiryTime:         Date (optional)
  status:             enum ["pending", "unlocked", "expired"] (default: "pending")
  timestamps:         createdAt, updatedAt
}
```

#### `Notification.js`
```js
{
  receiverId:  ObjectId → ref: "User" (required)
  capsuleId:   ObjectId → ref: "Capsule" (required)
  title:       String (required)
  message:     String (required)
  status:      enum ["unread", "read"] (default: "unread")
  timestamps:  createdAt, updatedAt
}
```

#### `AuditLog.js`
```js
{
  userId:    ObjectId → ref: "User" (required)
  capsuleId: ObjectId → ref: "Capsule" (required)
  action:    enum ["CREATE_CAPSULE", "UNLOCK_ATTEMPT", "DELETE_CAPSULE"] (required)
  result:    enum ["SUCCESS", "FAILURE"] (required)
  reason:    String (optional — failure details)
  timestamps: createdAt, updatedAt
}
```

---

## 4. Authentication & API Routes

### Middleware: `server/middleware/authMiddleware.js`
- **`protect`** ✅ — Extracts Bearer token from `Authorization` header, verifies with `jwt.verify()`, looks up user by decoded `id`, checks `status === "active"`, attaches `req.user` (passwordHash excluded).
- **`authorize(...roles)`** ✅ — Checks `req.user.role` against the allowed roles array; returns 403 if denied.

### Active API Endpoints

#### `POST /api/auth/login` — Public
- Validates email/password, compares bcrypt hash, returns JWT + user profile.

#### `GET /api/auth/me` — `protect`
- Returns currently authenticated user from `req.user`.

---

#### `POST /api/users/` — `protect` + `authorize("admin", "hr")`
- Creates a new user (provisioning).

#### `GET /api/users/` — `protect` + `authorize("admin", "hr")`
- Lists all users.

#### `GET /api/users/:id` — `protect` + `authorize("admin", "hr")`
- Gets a single user by ID.

#### `PATCH /api/users/:id/status` — `protect` + `authorize("admin")`
- Updates user `status` (active/disabled). **Admin only.**

#### `PATCH /api/users/:id` — `protect` + `authorize("admin", "hr")`
- Updates user fields (name, email, employeeId, role).

#### `DELETE /api/users/:id` — `protect` + `authorize("admin", "hr")`
- Deletes a user.

---

#### `POST /api/capsules/` — `protect` + `authorize("hr", "admin")` + `multer.single("file")`
- Creates capsule: uploads PDF → encrypts with AES-256-CBC → stores encrypted file → saves Capsule doc → triggers notification email.

#### `GET /api/capsules/my` — `protect` + `authorize("hr", "admin")`
- Lists capsules created by the authenticated sender.

#### `GET /api/capsules/assigned/me` — `protect` + `authorize("interviewer")`
- Lists capsules assigned to the authenticated interviewer.

#### `POST /api/capsules/:id/unlock` — `protect` + `authorize("interviewer")`
- Checks GPS proximity (Haversine) + `unlockTime` has passed → decrypts file → streams back to client. Logs result to AuditLog.

#### `DELETE /api/capsules/:id` — `protect` + `authorize("hr", "admin")`
- Deletes capsule document + removes encrypted file from disk.

---

#### `GET /api/notifications/me` — `protect` + `authorize("interviewer", "hr", "admin")`
- Lists notifications for the authenticated user.

#### `PATCH /api/notifications/:id/read` — `protect` + `authorize("interviewer", "hr", "admin")`
- Marks a notification as read.

---

#### `GET /api/audit-logs/` — `protect` + `authorize("admin", "hr")`
- Returns recent audit log entries.

#### `GET /api/health` — Public
- Health check endpoint.

> ⚠️ **Known Bug in `app.js`:** The `/api/notifications` route is registered **before** `cors()` and `express.json()` middleware, which may cause issues with request body parsing and CORS headers for that route group.

---

## 5. Frontend Integration

### Active Routes in `App.jsx`

| Path | Component(s) | Roles Allowed |
|---|---|---|
| `/login` | `Login` | Public |
| `/admin` | `UserList` | `admin` |
| `/hr` | `CreateUser` + `CreateCapsule` + `UserList` | `hr`, `admin` |
| `/interviewer` | `InterviewerCapsules` | `interviewer` |
| `*` (wildcard) | Redirects to `Login` | — |

### Pages Built

| Page | Status | Description |
|---|---|---|
| `Login.jsx` | ✅ Built | Email/password form, calls `AuthContext.login()`, redirects by role |
| `UserList.jsx` | ✅ Built | Lists users; supports disable/delete |
| `CreateUser.jsx` | ✅ Built | Form to provision new users (Admin/HR) |
| `CreateCapsule.jsx` | ✅ Built | Full form: title, description, receiver, file upload, GPS picker, unlock time, radius |
| `InterviewerCapsules.jsx` | ✅ Built | Lists assigned capsules; unlock button (sends GPS coords) |

### Components Built

| Component | Description |
|---|---|
| `ProtectedRoute.jsx` | Redirects unauthenticated users; enforces role-based access |
| `LocationPickerMap.jsx` | Leaflet map — click to set lat/lng, renders marker + radius circle |

### JWT Storage & Axios Integration ✅

- **Storage:** JWT stored in `localStorage` under key `"token"`. User profile stored under `"user"`.
- **Axios Interceptor:** `services/api.js` attaches `Authorization: Bearer <token>` header to every outgoing request automatically.
- **AuthContext:** Manages `user` state globally; `login()` and `logout()` handle localStorage lifecycle.

---

## 6. Phase 4+ Progress (Capsules, Encryption, GPS)

### File Upload (`multer`) ✅ COMPLETE
- `server/utils/multerConfig.js`: Disk storage to `server/uploads/`, unique filename, **PDF-only** file filter.
- Applied to `POST /api/capsules/` route.

### AES Encryption (`crypto`) ✅ COMPLETE
- `server/utils/encryption.js`:
  - **`encryptFile(inputPath, outputPath)`** — AES-256-CBC, random 16-byte IV prepended to output file.
  - **`decryptFileToBuffer(encryptedPath)`** — reads IV from first 16 bytes, decrypts remainder to Buffer.
  - Key sourced from `process.env.ENCRYPTION_KEY` (must be exactly 32 bytes).
- Both functions are used in `capsuleController.js`.

### Geolocation & Distance Check ✅ COMPLETE
- `server/utils/distance.js`: Haversine formula (`haversineDistanceMeters`) computes great-circle distance in meters.
- Used in `unlockCapsule` controller: receiver's submitted lat/lng is compared against capsule's stored coordinates. Access denied if outside `radiusMeters`.

### Time-Lock Check ✅ COMPLETE
- `unlockCapsule` controller checks `new Date() >= capsule.unlockTime` before allowing decryption.
- Capsule `status` field updated to `"unlocked"` on success, `"expired"` if `expiryTime` has passed.

### Email Notifications ✅ COMPLETE
- `server/services/notificationService.js`: Gmail SMTP via Nodemailer. Sends email + creates `Notification` DB record when a capsule is assigned.

### Audit Logging ✅ COMPLETE
- `server/services/auditService.js` + `AuditLog` model: Records `CREATE_CAPSULE`, `UNLOCK_ATTEMPT`, `DELETE_CAPSULE` events with SUCCESS/FAILURE results.

---

## 7. Summary of Outstanding Issues / Next Steps

| # | Issue / Gap | Severity |
|---|---|---|
| 1 | **Middleware ordering bug in `app.js`** — `notificationRoutes` is registered before `cors()` and `express.json()`. | 🔴 Bug |
| 2 | **No dedicated Admin Dashboard route** — `/admin` currently only renders `UserList`. | 🟡 Feature gap |
| 3 | **`/hr` route renders 3 components side-by-side** — No tabbed navigation or layout component wrapping HR views. | 🟡 UX gap |
| 4 | **No Capsule view/detail page** — Interviewers can unlock capsules but file download/preview UI may need enhancement. | 🟡 Feature gap |
| 5 | **`ENCRYPTION_KEY` must be exactly 32 bytes** — No validation or error handling if misconfigured in `.env`. | 🟠 Config risk |
| 6 | **No token refresh / expiry handling** — Client doesn't handle 401 responses gracefully (no logout redirect on expired token). | 🟡 UX gap |
| 7 | **`capsuleService.js` missing `unlockCapsule` function** — The `InterviewerCapsules.jsx` page calls the API but the service file doesn't export this function. | 🔴 Possible bug |
