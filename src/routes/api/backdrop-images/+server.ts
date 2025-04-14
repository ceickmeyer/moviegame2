import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const GET = async () => {
  try {
    const backdropDir = path.join(process.cwd(), 'static', 'letterboxd_backdrops');
    const backdropFiles = fs.readdirSync(backdropDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .map(file => `/letterboxd_backdrops/${file}`);

    return json(backdropFiles);
  } catch (error) {
    console.error('Error reading backdrop images:', error);
    return json(['/letterboxd_backdrops/default.jpg'], { status: 500 });
  }
};