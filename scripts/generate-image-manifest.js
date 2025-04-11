// 1. First, create a script to generate a JSON manifest of your images
// Save this as scripts/generate-image-manifest.js

import fs from "fs";
import path from "path";

// Path to your backdrop images
const backdropDir = path.join("static", "letterboxd_backdrops");
const outputPath = path.join("static", "backdrop-manifest.json");

// Read the directory
try {
  const files = fs
    .readdirSync(backdropDir)
    .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  // Write the manifest file
  fs.writeFileSync(outputPath, JSON.stringify(files, null, 2));
  console.log(`Generated manifest with ${files.length} images`);
} catch (error) {
  console.error("Error generating image manifest:", error);
}

// 2. Add this script to your package.json in the "scripts" section:
// "generate-manifest": "node scripts/generate-image-manifest.js",
// "build": "npm run generate-manifest && vite build"

// 3. Update your GameBoard.svelte component:

import { onMount } from "svelte";
import { base } from "$app/paths";

let backgroundImage = `${base}/letterboxd_backdrops/default.jpg`;
let backdropManifest = [];

onMount(async () => {
  try {
    // Fetch the backdrop manifest
    const response = await fetch(`${base}/backdrop-manifest.json`);
    if (!response.ok) throw new Error("Failed to load backdrop manifest");

    backdropManifest = await response.json();

    if (backdropManifest.length > 0) {
      // Select random image
      const randomIndex = Math.floor(Math.random() * backdropManifest.length);
      backgroundImage = `${base}/letterboxd_backdrops/${backdropManifest[randomIndex]}`;

      // Preload the image
      const img = new Image();
      img.src = backgroundImage;

      console.log("Selected backdrop:", backgroundImage);
    }
  } catch (error) {
    console.error("Error loading backdrop:", error);
    // Fallback to default.jpg
  }
});
