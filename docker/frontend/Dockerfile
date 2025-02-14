FROM node:20-alpine

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Clean install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY frontend .

EXPOSE 5174

# Clear Vite cache and start the development server
CMD rm -rf node_modules/.vite && npm run dev -- --host 0.0.0.0 