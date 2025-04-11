import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import type { RequestHandler } from "./$types";
import type { ApprovedClue } from "$lib/types/clueTypes";

export const GET: RequestHandler = async () => {
  try {
    // Read the approved clues file
    const approvedCluesPath = path.resolve("static/approved_clues.json");

    if (!fs.existsSync(approvedCluesPath)) {
      return json({ count: 0, movieCount: 0 });
    }

    const approvedClues: ApprovedClue[] = JSON.parse(
      fs.readFileSync(approvedCluesPath, "utf-8")
    );

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
