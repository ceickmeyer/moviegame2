#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Ensure data directory exists
mkdir -p /app/data

# Ensure approved_clues.json exists in data directory
if [ ! -f /app/data/approved_clues.json ]; then
  echo "[] " > /app/data/approved_clues.json
fi

# Copy letterboxd_movies.json from static to data if it doesn't exist in data
if [ -f /app/static/letterboxd_movies.json ] && [ ! -f /app/data/letterboxd_movies.json ]; then
  echo "Copying letterboxd_movies.json from static to data directory"
  cp /app/static/letterboxd_movies.json /app/data/letterboxd_movies.json
fi

# Copy backdrop_images.json to data if it doesn't exist in data
if [ -f /app/static/backdrop_images.json ] && [ ! -f /app/data/backdrop_images.json ]; then
  echo "Copying backdrop_images.json from static to data directory"
  cp /app/static/backdrop_images.json /app/data/backdrop_images.json
fi

# Create symbolic link from static to data for approved_clues.json
# This ensures the file is accessible from both locations
# Use -f to force overwrite if it already exists
echo "Creating symbolic link for approved_clues.json"
ln -sf /app/data/approved_clues.json /app/static/approved_clues.json

# Create symbolic links for static assets - check if directories exist first
echo "Creating symbolic links for static assets"

# Create client directory if it doesn't exist
mkdir -p /app/build/client

# Create symbolic links only if source directories/files exist
if [ -d /app/static/images ]; then
  ln -sf /app/static/images /app/build/client/images
  echo "Linked images directory"
else
  echo "Warning: /app/static/images directory not found, skipping symlink"
fi

if [ -d /app/static/posters ]; then
  ln -sf /app/static/posters /app/build/client/posters
  echo "Linked posters directory"
else
  echo "Warning: /app/static/posters directory not found, skipping symlink"
fi

if [ -d /app/static/letterboxd_backdrops ]; then
  ln -sf /app/static/letterboxd_backdrops /app/build/client/letterboxd_backdrops
  echo "Linked letterboxd_backdrops directory"
else
  echo "Warning: /app/static/letterboxd_backdrops directory not found, skipping symlink"
fi

if [ -f /app/static/logo.png ]; then
  ln -sf /app/static/logo.png /app/build/client/logo.png
  echo "Linked logo.png"
else
  echo "Warning: /app/static/logo.png file not found, skipping symlink"
fi

if [ -f /app/static/favicon.png ]; then
  ln -sf /app/static/favicon.png /app/build/client/favicon.png
  echo "Linked favicon.png"
else
  echo "Warning: /app/static/favicon.png file not found, skipping symlink"
fi

if [ -f /app/static/backdrop_images.json ]; then
  ln -sf /app/static/backdrop_images.json /app/build/client/backdrop_images.json
  echo "Linked backdrop_images.json"
else
  echo "Warning: /app/static/backdrop_images.json file not found, skipping symlink"
fi

echo "All symbolic links created successfully"
echo "Starting application..."

# List all files in the build directory to verify
echo "Contents of /app/build:"
ls -la /app/build
echo "Contents of /app/build/client:"
ls -la /app/build/client

# Check if the index.js file exists
if [ ! -f /app/build/index.js ]; then
  echo "ERROR: /app/build/index.js not found!"
  # List the contents of the app directory to help debug
  echo "Contents of /app:"
  ls -la /app
  exit 1
fi

echo "Starting Node.js application..."
# Start the application
exec node build/index.js