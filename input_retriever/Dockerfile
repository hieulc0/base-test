FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build (if using a build step, e.g., for TypeScript)
EXPOSE 8080 

# Start the application (adjust if your start command is different)
CMD ["npm", "start"]

