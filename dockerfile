# Use Node.js 18 as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Remove the build directory from .dockerignore
# This is a two-stage build approach
# First stage: build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create directories for mounted volumes
RUN mkdir -p /app/data /app/static

# Create symbolic link from static to data for approved_clues.json
# This ensures the file is accessible from both locations
RUN ln -sf /app/data/approved_clues.json /app/static/approved_clues.json

# Create directory for client-side access
RUN mkdir -p /app/build/client/data

# Make the startup script executable
RUN chmod +x /app/scripts/startup.sh

# Command to run the application using our startup script
CMD ["/app/scripts/startup.sh"]