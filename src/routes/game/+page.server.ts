// routes\game\+page.server.ts
import { json } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Movie } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue } from "$lib/types/clueTypes";
import { readStaticFile } from "$lib/utils/fileHelper";

export const load = (async () => {
  try {
    // Read the movies data and approved clues using our helper
    let moviesData: Movie[] = [];
    let approvedClues: ApprovedClue[] = [];

    try {
      moviesData = readStaticFile("letterboxd_movies.json");
      approvedClues = readStaticFile("approved_clues.json");
    } catch (error) {
      console.error("Error loading game data:", error);
      return {
        success: false,
        error: "Failed to load game data",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      success: false,
      error: "Failed to load game data",
    };
  }
}) satisfies PageServerLoad;