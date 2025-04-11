// lib/utils/fileHelper.ts
import fs from 'fs';
import path from 'path';

/**
 * Gets the appropriate base path for static files based on the environment
 */
export function getStaticFilePath(fileName: string): string {
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_URL;
  
  if (isVercel) {
    // For Vercel, we need to use a different approach
    // First try the /var/task directory (Vercel's function directory)
    const vercelPath = path.join('/var/task', 'static', fileName);
    
    // Check if the file exists in the expected Vercel path
    if (fs.existsSync(vercelPath)) {
      return vercelPath;
    }
    
    // Otherwise try the .vercel/output/static directory
    const vercelOutputPath = path.join('.vercel', 'output', 'static', fileName);
    if (fs.existsSync(vercelOutputPath)) {
      return vercelOutputPath;
    }
    
    // Last resort - try relative to current directory
    return path.join('./static', fileName);
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
  const filePath = getStaticFilePath(fileName);
  
  try {
    if (fileName.endsWith('.json')) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      return fs.readFileSync(filePath);
    }
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    throw error;
  }
}

/**
 * Writes data to a static file
 */
export function writeStaticFile(fileName: string, data: any): void {
  const filePath = getStaticFilePath(fileName);
  
  try {
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