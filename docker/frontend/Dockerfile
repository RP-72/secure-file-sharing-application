FROM node:20-alpine

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Clean install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY frontend .

EXPOSE 3000

# Update the start command to include host flag
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 