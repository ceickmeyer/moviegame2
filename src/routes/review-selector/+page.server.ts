// routes/review-selector/+page.server.ts
import { json } from "@sveltejs/kit";
import { getSentencePairs } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue, RejectedClue } from "$lib/types/clueTypes";
import type { Actions, PageServerLoad } from "./$types";
import { supabase } from "$lib/supabaseClient";

export const load = (async () => {
  try {
    // Fetch movies from Supabase
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*');
      
    if (moviesError) {
      console.error("Error fetching movies:", moviesError);
      return {
        movies: [],
        approvedCount: 0,
        rejectedCount: 0,
        error: "Failed to load movie data",
      };
    }
    
    // Get count of approved clues
    const { count: approvedCount, error: approvedError } = await supabase
      .from('movie_clues')
      .select('*', { count: 'exact', head: true });
      
    if (approvedError) {
      console.error("Error getting approved clue count:", approvedError);
    }

    return {
      movies: moviesData || [],
      approvedCount: approvedCount || 0,
      rejectedCount: 0, // Rejected clues aren't stored in the database
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      movies: [],
      approvedCount: 0,
      rejectedCount: 0,
      error: "Failed to load movie data",
    };
  }
}) satisfies PageServerLoad;

export const actions = {
  approve: async ({ request }) => {
    const formData = await request.formData();
    const movieId = formData.get("movieId")?.toString();
    const movieTitle = formData.get("movieTitle")?.toString();
    const movieYear = formData.get("movieYear")?.toString() || "";
    const clueText = formData.get("clueText")?.toString();
    const ratingStr = formData.get("rating")?.toString();
    const isLikedStr = formData.get("is_liked")?.toString();
    const reviewer = formData.get("reviewer")?.toString() || "Anonymous";
    const reviewUrl = formData.get("reviewUrl")?.toString() || "";

    const rating =
      ratingStr && ratingStr !== "" ? parseFloat(ratingStr) : undefined;
    const is_liked = isLikedStr === "true" ? true : false;

    if (!movieId || !movieTitle || !clueText) {
      return { success: false, error: "Missing required data" };
    }

    try {
      // Generate a unique ID for the clue
      const clueId = `${movieId}-${Date.now()}`;

      // Insert into Supabase
      const { error } = await supabase
        .from('movie_clues')
        .insert([{
          id: clueId,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_year: movieYear,
          clue_text: clueText,
          approved_at: new Date().toISOString(),
          rating,
          is_liked,
          reviewer,
          review_url: reviewUrl
        }]);
        
      if (error) {
        console.error("Error saving approved clue:", error);
        return { success: false, error: "Failed to save approved clue" };
      }
      
      // Get updated count
      const { count: approvedCount } = await supabase
        .from('movie_clues')
        .select('*', { count: 'exact', head: true });

      return {
        success: true,
        message: "Clue approved!",
        approvedCount: approvedCount || 0,
      };
    } catch (error) {
      console.error("Error saving approved clue:", error);
      return { success: false, error: "Failed to save approved clue" };
    }
  },

  reject: async ({ request }) => {
    // For rejection, you might simply not add it to the database
    // since you're not storing rejected clues
    return {
      success: true,
      message: "Clue rejected!",
      rejectedCount: 0, // You're not storing rejected clues in Supabase
    };
  },
};