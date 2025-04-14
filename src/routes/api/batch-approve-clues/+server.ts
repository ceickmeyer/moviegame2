// routes/api/batch-approve-clues/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabaseClient";

interface BatchClueRequest {
  clues: {
    movieId: string;
    movieTitle: string;
    movieYear: string | number;
    clueText: string;
    rating?: number;
    is_liked?: boolean;
    reviewer?: string;
    reviewUrl?: string;
  }[];
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as BatchClueRequest;

    if (!data.clues || !Array.isArray(data.clues) || data.clues.length === 0) {
      return json(
        { success: false, error: "No clues provided" },
        { status: 400 }
      );
    }

    // Log incoming data for debugging
    console.log(
      "Received clues to approve:",
      JSON.stringify(data.clues, null, 2)
    );

    let newCluesAdded = 0;
    const cluesInsertData = data.clues.map(clue => ({
      id: `${clue.movieId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      movie_id: clue.movieId,
      movie_title: clue.movieTitle,
      movie_year: clue.movieYear,
      clue_text: clue.clueText,
      rating: clue.rating,
      is_liked: clue.is_liked,
      reviewer: clue.reviewer || 'Anonymous',
      review_url: clue.reviewUrl || '',
      approved_at: new Date().toISOString()
    }));

    // Insert clues into Supabase
    const { data: insertedClues, error } = await supabase
      .from('movie_clues')
      .insert(cluesInsertData)
      .select();

    if (error) {
      console.error("Error inserting clues:", error);
      return json({ success: false, error: "Error inserting clues" }, { status: 500 });
    }

    newCluesAdded = insertedClues?.length || 0;

    // Get the total count of approved clues
    const { count: approvedCount, error: countError } = await supabase
      .from('movie_clues')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error getting count:", countError);
    }

    return json({
      success: true,
      message: `Added ${newCluesAdded} new clues.`,
      approvedCount: approvedCount || 0,
    });
  } catch (error) {
    console.error("Error processing batch clue approval:", error);
    return json({ success: false, error: "Server error" }, { status: 500 });
  }
};