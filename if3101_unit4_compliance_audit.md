# IF3101 Academic Compliance Audit — UNIT IV (Webpack & REST Endpoints)

---

## 1. Unit 4 Concept Compliance Matrix

| Syllabus Topic | Status | File Location |
| :--- | :---: | :--- |
| **Intro to Webpack & Bundling** | Fully Implemented | `client/vite.config.js`, `client/package.json` |
| **Dependency Graph** | Fully Implemented | `client/src/main.tsx` (entry), `server/server.ts` |
| **Plugins & Loaders/Modules** | Partially Implemented | `client/vite.config.js` (React + Tailwind plugins; no explicit rollupOptions) |
| **Adding Node Modules** | Fully Implemented | `server/package.json`, `client/package.json` — 20+ packages |
| **REST Endpoints — GET** | Fully Implemented | `authRoutes`, `userRoutes`, `capsuleRoutes`, `notificationRoutes`, `auditRoutes` |
| **REST Endpoints — POST** | Fully Implemented | `authRoutes` (login), `capsuleRoutes` (create, unlock), `userRoutes` (create) |
| **REST Endpoints — PATCH** | Fully Implemented | `userRoutes` (status, profile), `notificationRoutes` (mark read) |
| **REST Endpoints — DELETE** | Fully Implemented | `capsuleRoutes` (`/:id`), `userRoutes` (`/:id`) |
| **REST Endpoints — PUT** | MISSING | No `router.put()` verb found in any route file |
| **Mailer Integration** | Fully Implemented | `server/services/notificationService.ts` |
| **Other Examples (Cron/Triggers)** | MISSING | No cron, setInterval, or node-cron found in `server/` |

---

## 2. Detailed Code Evidence Analysis

### Vite Bundler (Webpack Equivalent)
File: client/vite.config.js
- Uses `defineConfig` from vite
- `@vitejs/plugin-react` — JSX/TSX transpilation (equiv to babel-loader)
- `@tailwindcss/vite` — CSS pipeline (equiv to css-loader + postcss-loader)
- `vite build` produces optimised, tree-shaken bundle in `client/dist/`

### Entry Points / Dependency Graph
| Entry Point | Role |
| client/src/main.tsx | DOM mount root — ReactDOM.createRoot |
| server/server.ts | HTTP server boot — http.createServer(app) |
| server/app.ts | Route aggregator — mounts all 5 route groups |

### Full REST Endpoint Surface
| Verb | Route | Controller |
| POST | /api/auth/login | authController.login |
| GET | /api/auth/me | authController.getMe |
| POST | /api/users/ | userController.createUser |
| GET | /api/users/ | userController.listUsers |
| GET | /api/users/:id | userController.getUserById |
| PATCH | /api/users/:id/status | userController.updateUserStatus |
| PATCH | /api/users/:id | userController.updateUser |
| DELETE | /api/users/:id | userController.deleteUser |
| POST | /api/capsules/ | capsuleController.createCapsule |
| GET | /api/capsules/my | capsuleController.listCapsulesBySender |
| GET | /api/capsules/assigned/me | capsuleController.listCapsulesAssignedToReceiver |
| POST | /api/capsules/:id/unlock | capsuleController.unlockCapsule |
| DELETE | /api/capsules/:id | capsuleController.deleteCapsule |
| GET | /api/notifications/me | notificationController.getMyNotifications |
| PATCH | /api/notifications/:id/read | notificationController.markRead |
| GET | /api/audit-logs/ | auditController.getRecentLogs |

### Mailer Integration
File: server/services/notificationService.ts
- nodemailer.createTransport() over SMTP TLS (port 465, Gmail)
- Custom lookup() callback forces IPv4 DNS resolution (dns.lookup family: 4) to prevent IPv6 failures
- Rich HTML email template with inline styles, capsule deep-link, and unlock time
- In-app Notification document created in MongoDB alongside email dispatch
- try/catch prevents mailer failure from breaking capsule creation flow

---

## 3. Gap Analysis & Implementation Plan

### Gap 1: Missing PUT HTTP Verb
No router.put() exists anywhere. Adding a PUT /:id route for full user replace
reuses the existing updateUser controller — zero new logic required.

Fix for server/routes/userRoutes.ts:
  router.put("/:id", protect, authorize("admin"), uploadAvatar.single("profileImage"), updateUser);

### Gap 2: Missing Cron / Background Task
No recurring server-side task. A native setInterval capsule-expiry checker
satisfies the requirement without adding external packages.

Fix for server/server.ts (after server.listen()):
  const EXPIRY_MS = 60 * 1000;
  setInterval(async () => {
      const Capsule = require("./models/Capsule");
      try {
          const r = await Capsule.updateMany(
              { expiryTime: { $lt: new Date() }, status: { $ne: "expired" } },
              { $set: { status: "expired" } }
          );
          if (r.modifiedCount > 0) console.log(`[Cron] Expired ${r.modifiedCount} capsule(s).`);
      } catch (err: any) {
          console.error("[Cron] Expiry check failed:", err.message);
      }
  }, EXPIRY_MS);
  console.log("[Cron] Auto-expiry task started (60s interval).");

### Optional: Enhance vite.config.js with explicit rollupOptions
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: "./index.html" },
      output: { chunkFileNames: "assets/[name]-[hash].js" },
    },
    sourcemap: true,
  },
})