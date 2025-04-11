import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import type { PageServerLoad } from "./$types";
import type { Movie } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue } from "$lib/types/clueTypes";

export const load = (async () => {
  try {
    // Read the movies data from the static JSON file
    const moviesDataPath = path.resolve("static/letterboxd_movies.json");
    let moviesData: Movie[] = [];

    if (fs.existsSync(moviesDataPath)) {
      moviesData = JSON.parse(fs.readFileSync(moviesDataPath, "utf-8"));
    }

    // Read approved clues
    const approvedCluesPath = path.resolve("static/approved_clues.json");
    let approvedClues: ApprovedClue[] = [];

    if (fs.existsSync(approvedCluesPath)) {
      approvedClues = JSON.parse(fs.readFileSync(approvedCluesPath, "utf-8"));
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
