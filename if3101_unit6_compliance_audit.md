# IF3101 Academic Compliance Audit — UNIT VI (Deployment Through Containers)

---

## 1. Unit 6 Concept Compliance Matrix

| Syllabus Topic | Status | File Location |
| :--- | :---: | :--- |
| **Containerization Architecture** | Fully Implemented | `client/Dockerfile`, `server/Dockerfile`, `docker-compose.yml` |
| **Installation & Setup (Base Images)** | Fully Implemented | `node:20-alpine` (both), `nginx:alpine` (client Stage 2) |
| **Pulling Images** | Fully Implemented | `FROM node:20-alpine`, `FROM nginx:alpine` — 3 distinct image pulls |
| **Creating Images (Dockerfile)** | Fully Implemented | Multi-stage Dockerfile in `client/` and `server/` |
| **Multi-Stage Build** | Fully Implemented | Both Dockerfiles use `AS builder` + slim production stage |
| **.dockerignore Files** | Fully Implemented | Root `.dockerignore`, `client/.dockerignore`, `server/.dockerignore` |
| **Deploying to DockerHub** | Partially Implemented | No explicit `docker build -t user/image:tag` tag convention or push script found |
| **docker-compose Orchestration** | Fully Implemented | `docker-compose.yml` at root — `api` + `web` services, port mappings |
| **Environment Variable Handling** | Partially Implemented | `environment:` block in compose only sets `NODE_ENV` and `PORT`; remaining secrets left as manual `--env-file` injection (noted in comment) |
| **Container Linking / depends_on** | Fully Implemented | `web.depends_on: api` ensures server boots before Nginx client |
| **Port Mapping** | Fully Implemented | `5000:5000` (API), `80:80` (Nginx) |
| **Volume / Persistent Storage** | Fully Implemented | `./server/uploads:/app/uploads` bind mount |

---

## 2. Detailed Code Evidence Analysis

### client/Dockerfile (Multi-Stage)
Stage 1 — Build:
  Line 2:  FROM node:20-alpine AS builder     # Pull official slim Node image
  Line 3:  WORKDIR /app                        # Set working directory
  Line 4:  COPY package*.json ./               # Copy manifest first (layer caching)
  Line 5:  RUN npm install                     # Install all deps
  Line 6:  COPY . .                            # Copy source
  Line 8:  RUN npm run build                   # Vite production build -> /app/dist

Stage 2 — Serve:
  Line 11: FROM nginx:alpine                   # Pull official Nginx image
  Line 13: COPY --from=builder /app/dist /usr/share/nginx/html  # Copy built assets
  Line 15: EXPOSE 80                           # Declare HTTP port
  Line 16: CMD ["nginx", "-g", "daemon off;"]  # Start server in foreground

### server/Dockerfile (Multi-Stage)
Stage 1 — Build:
  Line 1:  FROM node:20-alpine AS builder
  Line 4:  COPY package*.json ./
  Line 5:  RUN npm install
  Line 7:  RUN npm run build                   # tsc compiles TS -> dist/

Stage 2 — Production:
  Line 9:  FROM node:20-alpine                 # Fresh slim image (no dev deps)
  Line 12: RUN npm install --omit=dev          # Production-only deps
  Line 14: COPY --from=builder /app/dist ./dist
  Line 16: EXPOSE 5000
  Line 17: CMD ["npm", "run", "start"]         # node dist/server.js

### docker-compose.yml
  version: '3.8'
  services:
    api:                            # Express/Node backend
      build: ./server               # Points to server/Dockerfile
      ports: ["5000:5000"]          # Host:Container mapping
      environment:
        - NODE_ENV=production
        - PORT=5000
      volumes:
        - ./server/uploads:/app/uploads

    web:                            # React/Nginx frontend
      build: ./client               # Points to client/Dockerfile
      ports: ["80:80"]
      depends_on: [api]             # Container dependency link

### .dockerignore Files
All three .dockerignore files exclude:
  - node_modules/     (prevents local deps from polluting image context)
  - dist/             (build artifacts regenerated inside container)
  - .env / .env.*     (secrets never baked into image layers)
  - *.log             (server) / .git (client)

---

## 3. Gap Analysis & Implementation Plan

Two gaps remain for 100% Unit 6 compliance:

### Gap 1: No DockerHub Tagging / Push Convention
No Makefile, shell script, or npm script demonstrates the docker build -t and docker push workflow.

Fix: Create a root-level Makefile (or deploy.sh) with standard DockerHub conventions.

  # Makefile (root)
  DOCKER_USER=jeevakumara
  IMAGE_SERVER=time-capsule-server
  IMAGE_CLIENT=time-capsule-client
  TAG=latest

  build:
      docker build -t $(DOCKER_USER)/$(IMAGE_SERVER):$(TAG) ./server
      docker build -t $(DOCKER_USER)/$(IMAGE_CLIENT):$(TAG) ./client

  push:
      docker push $(DOCKER_USER)/$(IMAGE_SERVER):$(TAG)
      docker push $(DOCKER_USER)/$(IMAGE_CLIENT):$(TAG)

  up:
      docker compose up --build

  down:
      docker compose down

### Gap 2: Incomplete env_file in docker-compose.yml
The current compose file only passes NODE_ENV and PORT.
The remaining secrets (MONGO_URI, JWT_SECRET, etc.) are passed manually.
Using env_file makes the compose self-documenting and exam-complete.

Fix: Add env_file directive to docker-compose.yml api service:
  api:
    build: ./server
    ports:
      - "5000:5000"
    env_file:
      - ./server/.env.example     # Reference non-secret example file
    environment:
      - NODE_ENV=production       # Override specific keys
    volumes:
      - ./server/uploads:/app/uploads