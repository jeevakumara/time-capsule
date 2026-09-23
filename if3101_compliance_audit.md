# IF3101 Academic Compliance Audit - UNIT I (Server Side Actions)

## 1. Unit 1 Concept Compliance Matrix

| Syllabus Topic | Status | File Location / Context |
| :--- | :--- | :--- |
| **Node and NPM (Installation, Scripts, Dependencies)** | ✅ Fully Implemented | `server/package.json`, `server/package-lock.json` |
| **Commands & Packaging** | ✅ Fully Implemented | `server/package.json` (`start`, `dev`, `build` scripts) |
| **Node Core Module: `filesystem` (`fs`)** | ❌ Missing | File uploads (`multer`) use memory storage (`memoryStorage`), skipping disk I/O. |
| **Node Core Module: `http` / `https`** | ⚠️ Partially Implemented | Express handles HTTP implicitly via `app.listen()`. Explicit instantiation is missing. |
| **Node Core Module: `os`** | ❌ Missing | No system-level metrics (memory, platform, cpu) are read. |
| **Node Core Module: `path`** | ❌ Missing | No explicit path resolution or directory joining is used. |
| **Node Core Module: `process`** | ✅ Fully Implemented | Extensively used (e.g., `process.env.MONGO_URI`, `process.exit(1)` in `db.ts`). |
| **Collaborative Version Control (`git`)** | ✅ Fully Implemented | `.git/`, `.gitignore`, and Git commit history present. |
| **Full MERN Stack Integration** | ✅ Fully Implemented | MongoDB (Atlas), Express API, React (Vite frontend), Node environment fully wired. |

---

## 2. Detailed Code Evidence Analysis

### Node and NPM / Commands & Packaging
*   **File:** `server/package.json`
*   **Evidence:** Contains core dependencies (`express`, `mongoose`) and lifecycle scripts:
    ```json
    "scripts": {
      "start": "node dist/server.js",
      "dev": "nodemon --exec tsx server.ts",
      "build": "npx rimraf dist && tsc"
    }
    ```

### Node Core Module: `process`
*   **Files:** `server/server.ts`, `server/config/db.ts`
*   **Evidence:** 
    *   `process.env.NODE_ENV !== 'production'` (`server.ts` line 1)
    *   `process.exit(1)` upon database failure (`db.ts` line 9)
    *   Access to environment variables securely via `process.env`.

### Collaborative Version Control & Full MERN Integration
*   **Files:** `server/.gitignore`, `server/config/db.ts`, `server/app.ts`
*   **Evidence:** Active `.git` tree and commits demonstrate version control. Mongoose connects Node/Express to MongoDB seamlessly in `db.ts` (`mongoose.connect`).

---

## 3. Gap Analysis & Implementation Plan

To achieve 100% strict academic compliance with the IF3101 Unit 1 syllabus, the project must explicitly demonstrate the use of missing Node core modules. 

The following isolated, non-disruptive additions to the `server/` codebase will fulfill all remaining requirements.

### Gap 1: Explicit `http` Module Usage
*Currently, the server uses Express's wrapper `app.listen()`. Academic grading often requires demonstrating the native Node `http` module.*

**Action:** Update `server/server.ts` to wrap Express in the native HTTP server.
```typescript
// server/server.ts
const http = require("http"); // <-- ADD THIS

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}
const app = require("./app");

// ... environment validation ...

const PORT = process.env.PORT || 5000;

// Update app.listen to use native http module:
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Gap 2: `os` and `path` Module Usage
*System diagnostics and secure file pathing are missing.*

**Action:** Expose a new hidden diagnostics route in `server/app.ts` to demonstrate `os` and `path`.
```typescript
// Add at the top of server/app.ts
const os = require("os");
const path = require("path");

// Add anywhere in the route definitions of app.ts
app.get("/api/system/diagnostics", (req, res) => {
    // Explicitly demonstrating 'os' module
    const systemInfo = {
        platform: os.platform(),
        architecture: os.arch(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpus: os.cpus().length
    };

    // Explicitly demonstrating 'path' module
    const currentDirectory = __dirname;
    const resolvedPath = path.resolve(currentDirectory, '..', 'package.json');
    const parsedPath = path.parse(resolvedPath);

    res.json({
        success: true,
        system: systemInfo,
        pathing: parsedPath
    });
});
```

### Gap 3: `fs` (Filesystem) Module Usage
*Since uploads bypass the disk entirely (MemoryStorage), we must introduce an intentional filesystem write operation to fulfill the syllabus.*

**Action:** Write a startup timestamp to a log file whenever the server boots. Add this directly inside `server/server.ts`.
```typescript
// Add at the top of server/server.ts
const fs = require("fs/promises");
const path = require("path");

// Add just before server.listen() in server.ts
const logFile = path.join(__dirname, 'startup.log');
const logMessage = `Server booted at ${new Date().toISOString()}\n`;

// Explicitly demonstrating asynchronous filesystem write
fs.appendFile(logFile, logMessage)
    .then(() => console.log("Startup logged to filesystem."))
    .catch(err => console.error("Failed to write log", err));
```
