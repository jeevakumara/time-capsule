FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev
# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["npm", "run", "start"]
