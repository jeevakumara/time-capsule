FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compile TypeScript to JavaScript
RUN npm run build
# Expose the port the app runs on
EXPOSE 5000
# Run the compiled JS
CMD ["npm", "run", "start"]
