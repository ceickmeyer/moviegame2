// routes\review-selector\+page.server.ts
import { json } from "@sveltejs/kit";
import { getSentencePairs } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue, RejectedClue } from "$lib/types/clueTypes";
import type { Actions, PageServerLoad } from "./$types";
import { readStaticFile, writeStaticFile } from "$lib/utils/fileHelper";

export const load = (async () => {
  try {
    // Read the movies data
    let moviesData;
    try {
      moviesData = readStaticFile("letterboxd_movies.json");
    } catch (error) {
      console.error("Error reading movies data:", error);
      return {
        movies: [],
        approvedCount: 0,
        rejectedCount: 0,
        error: "Failed to load movie data",
      };
    }

    // Read existing approved clues
    let approvedClues: ApprovedClue[] = [];
    try {
      approvedClues = readStaticFile("approved_clues.json");
    } catch (error) {
      console.log("No existing approved_clues.json, starting with empty array");
      approvedClues = [];
    }

    // Read existing rejected clues
    let rejectedClues: RejectedClue[] = [];
    try {
      rejectedClues = readStaticFile("rejected_clues.json");
    } catch (error) {
      console.log("No existing rejected_clues.json, starting with empty array");
      rejectedClues = [];
    }

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
      // Read existing approved clues
      let approvedClues: ApprovedClue[] = [];
      try {
        approvedClues = readStaticFile("approved_clues.json");
      } catch (error) {
        console.log("No existing approved_clues.json, starting with empty array");
        approvedClues = [];
      }

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
      writeStaticFile("approved_clues.json", approvedClues);

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
      // Read existing rejected clues
      let rejectedClues: RejectedClue[] = [];
      try {
        rejectedClues = readStaticFile("rejected_clues.json");
      } catch (error) {
        console.log("No existing rejected_clues.json, starting with empty array");
        rejectedClues = [];
      }

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
      writeStaticFile("rejected_clues.json", rejectedClues);

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