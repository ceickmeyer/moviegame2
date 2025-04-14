// routes/api/stats/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabaseClient";

export const GET: RequestHandler = async () => {
  try {
    // Get count of approved clues
    const { count: approvedCluesCount, error: countError } = await supabase
      .from('movie_clues')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error getting clue count:", countError);
      return json({ error: "Failed to get stats" }, { status: 500 });
    }
    
    // Get count of unique movies that have clues
    const { data: moviesWithClues, error: moviesError } = await supabase
      .from('movie_clues')
      .select('movie_id')
      .limit(1000); // Add a reasonable limit
    
    if (moviesError) {
      console.error("Error getting movies with clues:", moviesError);
      return json({ error: "Failed to get stats" }, { status: 500 });
    }
    
    // Count unique movie IDs
    const uniqueMovieIds = new Set(moviesWithClues.map(clue => clue.movie_id));
    const movieCount = uniqueMovieIds.size;
    
    return json({
      count: approvedCluesCount || 0,
      movieCount: movieCount,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    return json({ error: "Failed to get stats" }, { status: 500 });
  }
};