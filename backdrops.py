import os
import json

# Path to backdrop images
backdrop_dir = "static/letterboxd_backdrops"
output_file = "static/backdrop_images.json"

# Get all image files with common extensions
image_exts = ['.jpg', '.jpeg', '.png', '.webp']
backdrop_files = []

for file in os.listdir(backdrop_dir):
    if any(file.lower().endswith(ext) for ext in image_exts):
        # Store the path relative to static folder
        backdrop_files.append(f"/letterboxd_backdrops/{file}")

# Save to JSON file
with open(output_file, 'w') as f:
    json.dump(backdrop_files, f)

print(f"Generated JSON with {len(backdrop_files)} backdrop images")