// routes/api/delete-clue/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from "$lib/supabaseClient";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ success: false, error: 'Missing clue ID' }, { status: 400 });
    }
    
    // Delete the clue from Supabase
    const { error } = await supabase
      .from('movie_clues')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting clue:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'Clue deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting clue:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};