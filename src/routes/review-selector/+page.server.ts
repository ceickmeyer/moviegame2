// routes\review-selector\+page.server.ts
import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import { getSentencePairs } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue, RejectedClue } from "$lib/types/clueTypes";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async () => {
  try {
    // Determine the base path based on environment
    const basePath = process.env.NODE_ENV === 'production' ? '/app/static' : 'static';
    
    // Read the movies data from the JSON file
    const moviesDataPath = path.resolve(basePath, "letterboxd_movies.json");
    const moviesData = JSON.parse(fs.readFileSync(moviesDataPath, "utf-8"));

    // Initialize the approved clues file if it doesn't exist
    const approvedCluesPath = path.resolve(basePath, "approved_clues.json");
    if (!fs.existsSync(approvedCluesPath)) {
      fs.writeFileSync(approvedCluesPath, JSON.stringify([], null, 2), "utf-8");
    }

    // Initialize the rejected clues file if it doesn't exist
    const rejectedCluesPath = path.resolve(basePath, "rejected_clues.json");
    if (!fs.existsSync(rejectedCluesPath)) {
      fs.writeFileSync(rejectedCluesPath, JSON.stringify([], null, 2), "utf-8");
    }

    // Read existing approved clues
    const approvedClues: ApprovedClue[] = JSON.parse(
      fs.readFileSync(approvedCluesPath, "utf-8")
    );

    // Read existing rejected clues
    const rejectedClues: RejectedClue[] = JSON.parse(
      fs.readFileSync(rejectedCluesPath, "utf-8")
    );

    // Get all approved and rejected clue IDs (to avoid showing again)
    const reviewedClueIds = new Set([
      ...approvedClues.map((clue) => clue.id),
      ...rejectedClues.map((clue) => clue.id),
    ]);

    return {
      movies: moviesData,
      approvedCount: approvedClues.length,
      rejectedCount: rejectedClues.length,
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
    const movieYearValue = formData.get("movieYear")?.toString() || "";
    const movieYear = movieYearValue;
    const clueText = formData.get("clueText")?.toString();
    const ratingStr = formData.get("rating")?.toString();
    const isLikedStr = formData.get("is_liked")?.toString();

    const rating =
      ratingStr && ratingStr !== "" ? parseFloat(ratingStr) : undefined;
    const is_liked = isLikedStr === "true" ? true : false;

    if (!movieId || !movieTitle || !clueText) {
      return { success: false, error: "Missing required data" };
    }

    try {
      // Determine the base path based on environment
      const basePath = process.env.NODE_ENV === 'production' ? '/app/static' : 'static';
      
      // Read existing approved clues
      const approvedCluesPath = path.resolve(basePath, "approved_clues.json");
      const approvedClues: ApprovedClue[] = fs.existsSync(approvedCluesPath)
        ? JSON.parse(fs.readFileSync(approvedCluesPath, "utf-8"))
        : [];

      // Generate a unique ID for the clue
      const clueId = `${movieId}-${Date.now()}`;

      // Add the new approved clue
      approvedClues.push({
        id: clueId,
        movieId,
        movieTitle,
        movieYear,
        clueText,
        rating,
        is_liked,
        approvedAt: new Date().toISOString(),
      });

      // Write back to the file
      fs.writeFileSync(
        approvedCluesPath,
        JSON.stringify(approvedClues, null, 2),
        "utf-8"
      );

      return {
        success: true,
        message: "Clue approved!",
        approvedCount: approvedClues.length,
      };
    } catch (error) {
      console.error("Error saving approved clue:", error);
      return { success: false, error: "Failed to save approved clue" };
    }
  },

  // Similarly update the reject action to include rating and is_liked:
  reject: async ({ request }) => {
    const formData = await request.formData();
    const movieId = formData.get("movieId")?.toString();
    const movieTitle = formData.get("movieTitle")?.toString();
    const movieYearValue = formData.get("movieYear")?.toString() || "";
    const movieYear = movieYearValue;
    const clueText = formData.get("clueText")?.toString();
    const ratingStr = formData.get("rating")?.toString();
    const isLikedStr = formData.get("is_liked")?.toString();

    const rating =
      ratingStr && ratingStr !== "" ? parseFloat(ratingStr) : undefined;
    const is_liked = isLikedStr === "true" ? true : false;

    if (!movieId || !movieTitle || !clueText) {
      return { success: false, error: "Missing required data" };
    }

    try {
      // Determine the base path based on environment
      const basePath = process.env.NODE_ENV === 'production' ? '/app/static' : 'static';
      
      // Read existing rejected clues
      const rejectedCluesPath = path.resolve(basePath, "rejected_clues.json");
      const rejectedClues: RejectedClue[] = fs.existsSync(rejectedCluesPath)
        ? JSON.parse(fs.readFileSync(rejectedCluesPath, "utf-8"))
        : [];

      // Generate a unique ID for the clue
      const clueId = `${movieId}-${Date.now()}`;

      // Add the new rejected clue
      rejectedClues.push({
        id: clueId,
        movieId,
        movieTitle,
        movieYear,
        clueText,
        rating,
        is_liked,
        rejectedAt: new Date().toISOString(),
      });

      // Write back to the file
      fs.writeFileSync(
        rejectedCluesPath,
        JSON.stringify(rejectedClues, null, 2),
        "utf-8"
      );

      return {
        success: true,
        message: "Clue rejected!",
        rejectedCount: rejectedClues.length,
      };
    } catch (error) {
      console.error("Error saving rejected clue:", error);
      return { success: false, error: "Failed to save rejected clue" };
    }
  },
};
