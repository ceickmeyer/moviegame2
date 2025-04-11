// routes\api\update-clue\+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readStaticFile, writeStaticFile } from '$lib/utils/fileHelper';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, clueText } = await request.json();
    
    if (!id || !clueText) {
      return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Read the current approved clues
    let approvedClues;
    try {
      approvedClues = readStaticFile("approved_clues.json");
    } catch (error) {
      return json({ success: false, error: 'Failed to read clues data' }, { status: 500 });
    }
    
    // Find and update the clue
    const clueIndex = approvedClues.findIndex((clue: any) => clue.id === id);
    
    if (clueIndex === -1) {
      return json({ success: false, error: 'Clue not found' }, { status: 404 });
    }
    
    // Update the clue text
    approvedClues[clueIndex].clueText = clueText;
    
    // Write the updated clues back to the file
    try {
      writeStaticFile("approved_clues.json", approvedClues);
    } catch (error) {
      return json({ success: false, error: 'Failed to write updated clues' }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating clue:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};