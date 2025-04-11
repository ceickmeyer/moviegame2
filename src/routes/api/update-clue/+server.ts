import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RequestHandler } from './$types';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the approved clues file
// In Docker, we need to check if we're in production and use the correct path
const approvedCluesPath = process.env.NODE_ENV === 'production'
  ? path.resolve('/app/static/approved_clues.json')
  : path.resolve(__dirname, '../../../../static/approved_clues.json');

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, clueText } = await request.json();
    
    if (!id || !clueText) {
      return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Read the current approved clues
    const approvedCluesData = fs.readFileSync(approvedCluesPath, 'utf-8');
    const approvedClues = JSON.parse(approvedCluesData);
    
    // Find and update the clue
    const clueIndex = approvedClues.findIndex((clue: any) => clue.id === id);
    
    if (clueIndex === -1) {
      return json({ success: false, error: 'Clue not found' }, { status: 404 });
    }
    
    // Update the clue text
    approvedClues[clueIndex].clueText = clueText;
    
    // Write the updated clues back to the file
    fs.writeFileSync(approvedCluesPath, JSON.stringify(approvedClues, null, 2));
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating clue:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};