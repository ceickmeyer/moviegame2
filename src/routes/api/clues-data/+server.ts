import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ url }: RequestEvent) => {
  try {
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400 });
    }
    
    // Determine the base paths based on environment
    // Check if we're on Vercel
    const isVercel = process.env.VERCEL === '1';
    
    // Use appropriate paths based on environment
    let dataPath, staticPath;
    
    if (isVercel) {
      // On Vercel, use relative paths
      dataPath = './data';
      staticPath = './static';
    } else if (process.env.NODE_ENV === 'production') {
      // In Docker production
      dataPath = '/app/data';
      staticPath = '/app/static';
    } else {
      // Local development
      dataPath = 'data';
      staticPath = 'static';
    }
    
    let fileData;
    
    if (dataType === 'approved') {
      // For approved clues, try static directory first, then data
      try {
        const filePath = path.resolve(staticPath, 'approved_clues.json');
        fileData = fs.readFileSync(filePath, 'utf-8');
        console.log(`Loaded approved clues from ${filePath}`);
      } catch (error) {
        console.log(`Failed to load from ${staticPath}, trying ${dataPath}...`);
        const filePath = path.resolve(dataPath, 'approved_clues.json');
        fileData = fs.readFileSync(filePath, 'utf-8');
        console.log(`Loaded approved clues from ${filePath}`);
      }
    } else {
      // For movies, try data directory first, then static
      try {
        const filePath = path.resolve(dataPath, 'letterboxd_movies.json');
        fileData = fs.readFileSync(filePath, 'utf-8');
        console.log(`Loaded movies from ${filePath}`);
      } catch (error) {
        console.log(`Failed to load from ${dataPath}, trying ${staticPath}...`);
        const filePath = path.resolve(staticPath, 'letterboxd_movies.json');
        fileData = fs.readFileSync(filePath, 'utf-8');
        console.log(`Loaded movies from ${filePath}`);
      }
    }
    const data = JSON.parse(fileData);
    
    return json(data);
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};