// lib/utils/fileHelper.ts
import fs from 'fs';
import path from 'path';

/**
 * Gets the appropriate base path for static files based on the environment
 */
export function getStaticFilePath(fileName: string): string {
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // Vercel serverless functions can access files in the root directory
    // where the function is deployed
    
    // Try different possible paths for Vercel
    const possiblePaths = [
      // Root path where serverless function is deployed
      path.join(process.cwd(), 'static', fileName),
      // Try a direct path to static
      path.join('./static', fileName),
      // Try lambda custom path
      path.join('/var/task/static', fileName)
    ];
    
    // Return the first path that exists
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    
    // Fallback to the first path if none exist
    return possiblePaths[0];
  } else if (process.env.NODE_ENV === 'production') {
    // In Docker production
    return path.join('/app/static', fileName);
  } else {
    // Local development
    return path.join('static', fileName);
  }
}

/**
 * Reads a static file and returns its contents
 */
export function readStaticFile(fileName: string): any {
  try {
    // First try to read directly from the static folder
    const filePath = getStaticFilePath(fileName);
    
    if (fs.existsSync(filePath)) {
      if (fileName.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        return fs.readFileSync(filePath);
      }
    }
    
    // If file not found, return empty defaults for known file types
    if (fileName === 'letterboxd_movies.json') {
      return [];
    } else if (fileName === 'approved_clues.json') {
      return [];
    } else if (fileName === 'rejected_clues.json') {
      return [];
    }
    
    throw new Error(`File not found: ${fileName}`);
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    
    // Return empty defaults for known file types
    if (fileName === 'letterboxd_movies.json') {
      return [];
    } else if (fileName === 'approved_clues.json') {
      return [];
    } else if (fileName === 'rejected_clues.json') {
      return [];
    }
    
    throw error;
  }
}

/**
 * Writes data to a static file
 */
export function writeStaticFile(fileName: string, data: any): void {
  const filePath = getStaticFilePath(fileName);
  
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    if (typeof data === 'object') {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } else {
      fs.writeFileSync(filePath, data);
    }
  } catch (error) {
    console.error(`Error writing file ${fileName}:`, error);
    throw error;
  }
}