// routes/api/update-clue/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from "$lib/supabaseClient";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, clueText } = await request.json();
    
    if (!id || !clueText) {
      return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Update the clue text in Supabase
    const { error } = await supabase
      .from('movie_clues')
      .update({ clue_text: clueText })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating clue:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error updating clue:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};