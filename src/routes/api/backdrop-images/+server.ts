import { json } from '@sveltejs/kit';
import { promises as fs } from 'fs';
import path from 'path';

export const GET = async () => {
  try {
    // Add cache control headers - backdrop images rarely change
    const headers = {
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Expires': new Date(Date.now() + 86400000).toUTCString()
    };
    
    const backdropDir = path.join(process.cwd(), 'static', 'letterboxd_backdrops');
    
    // Use async file operations instead of sync
    const files = await fs.readdir(backdropDir);
    const backdropFiles = files
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .map(file => `/letterboxd_backdrops/${file}`);

    return json(backdropFiles, { headers });
  } catch (error) {
    console.error('Error reading backdrop images:', error);
    return json(['/letterboxd_backdrops/default.jpg'], {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  }
};