// routes\api\stats\+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { ApprovedClue } from "$lib/types/clueTypes";
import { readStaticFile } from "$lib/utils/fileHelper";

export const GET: RequestHandler = async () => {
  try {
    // Read the approved clues file using our helper
    let approvedClues: ApprovedClue[] = [];
    
    try {
      approvedClues = readStaticFile("approved_clues.json");
    } catch (error) {
      console.log("No existing approved_clues.json, starting with empty array");
      return json({ count: 0, movieCount: 0 });
    }

    // Count unique movies
    const uniqueMovies = new Set(approvedClues.map((clue) => clue.movieId));

    return json({
      count: approvedClues.length,
      movieCount: uniqueMovies.size,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    return json({ error: "Failed to get stats" }, { status: 500 });
  }
};