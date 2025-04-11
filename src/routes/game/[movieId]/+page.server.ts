// routes\game\[movieId]\+page.server.ts
import { error } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import type { PageServerLoad } from "./$types";
import type { Movie } from "$lib/utils/sentenceExtractor";

export const load = (async ({ params }) => {
  try {
    const { movieId } = params;

    // Read the movies data from the static JSON file
    const moviesDataPath = path.resolve("static/letterboxd_movies.json");
    let moviesData: Movie[] = [];

    if (fs.existsSync(moviesDataPath)) {
      moviesData = JSON.parse(fs.readFileSync(moviesDataPath, "utf-8"));
    }

    // Try to decode the obfuscated ID
    let decodedId;
    try {
      decodedId = atob(movieId);
    } catch (e) {
      // If it's not base64, try the old format for backward compatibility
      decodedId = movieId;
    }

    // Find the specific movie by the decoded ID
    let movie;

    if (decodedId.startsWith("id:")) {
      // It's an ID-based reference
      const actualId = decodedId.substring(3);
      movie = moviesData.find((m) => m.id === actualId);
    } else if (decodedId.startsWith("title:")) {
      // It's a title+year reference
      const titleYearString = decodedId.substring(6);
      const [title, yearStr] = titleYearString.split(":");
      movie = moviesData.find(
        (m) => m.title === title && m.year.toString() === yearStr
      );
    } else {
      // Fallback: try direct ID match for backward compatibility
      movie = moviesData.find((m) => m.id === movieId);

      // If not found, try matching by slug from title and year
      if (!movie) {
        movie = moviesData.find((m) => {
          const slugTitle = m.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

          const generatedId = `${slugTitle}-${m.year}`;
          return generatedId === movieId;
        });
      }
    }

    // If still not found, return 404
    if (!movie) {
      throw error(404, "Movie not found");
    }

    // Read approved clues to check if we have enough for this movie
    const approvedCluesPath = path.resolve("static/approved_clues.json");
    let approvedClues = [];

    if (fs.existsSync(approvedCluesPath)) {
      approvedClues = JSON.parse(fs.readFileSync(approvedCluesPath, "utf-8"));
    }

    // Check how many clues we have for this movie
    const movieIdForMatch = movie.id || `${movie.title}-${movie.year}`;
    const movieCluesCount = approvedClues.filter(
      (clue) => clue.movieId === movieIdForMatch
    ).length;

    // If we don't have enough clues, warn the user
    const hasEnoughClues = movieCluesCount >= 6;

    return {
      success: true,
      movieId,
      movieData: movie,
      hasEnoughClues,
    };
  } catch (err) {
    if (err.status === 404) {
      throw error(404, "Movie not found");
    }
    console.error("Error loading specific movie:", err);
    throw error(500, "Failed to load game data");
  }
}) satisfies PageServerLoad;
