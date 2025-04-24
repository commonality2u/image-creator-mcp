# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install production dependencies
# Using --omit=dev ensures only runtime dependencies are installed
# Using ci is generally faster and more reliable for builds than install
RUN npm ci --omit=dev

# Copy the rest of the application code into the container
# Using .dockerignore is recommended to exclude unnecessary files (like .git, node_modules outside container)
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Make port 5050 available to the world outside this container
EXPOSE 5050

# Define environment variable (optional, can be set at runtime)
# ENV NODE_ENV=production

# Run the compiled JavaScript code when the container launches
CMD ["node", "dist/index.js"]
