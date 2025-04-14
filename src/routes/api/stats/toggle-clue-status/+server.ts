// routes/api/stats/toggle-clue-status/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from "$lib/supabaseClient";

interface ToggleRequest {
  clue: {
    id: string;
    movieId: string;
    movieTitle: string;
    movieYear: string | number;
    clueText: string;
    approvedAt?: string;
    rejectedAt?: string;
  };
  currentStatus: 'approved' | 'rejected';
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { clue, currentStatus } = await request.json() as ToggleRequest;
    
    if (!clue || !clue.id || !currentStatus) {
      return json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    if (currentStatus === "approved") {
      // Change from approved to rejected
      // In Supabase this could be either updating an is_approved field or doing a soft delete
      // For this example, let's assume we're deleting the clue
      const { error } = await supabase
        .from('movie_clues')
        .delete()
        .eq('id', clue.id);
        
      if (error) {
        console.error('Error deleting clue:', error);
        return json({ success: false, error: 'Database error' }, { status: 500 });
      }
    } else if (currentStatus === "rejected") {
      // Change from rejected to approved
      // In Supabase, we would reinsert the clue
      const { error } = await supabase
        .from('movie_clues')
        .insert([{
          id: clue.id,
          movie_id: clue.movieId,
          movie_title: clue.movieTitle,
          movie_year: clue.movieYear,
          clue_text: clue.clueText,
          approved_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error('Error inserting clue:', error);
        return json({ success: false, error: 'Database error' }, { status: 500 });
      }
    } else {
      return json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    
    return json({
      success: true,
      message: `Clue ${
        currentStatus === "approved" ? "rejected" : "approved"
      } successfully`,
    });
  } catch (error) {
    console.error('Error toggling clue status:', error);
    return json({ success: false, error: "Server error" }, { status: 500 });
  }
};