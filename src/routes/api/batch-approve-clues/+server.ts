// routes\api\batch-approve-clues\+server.ts
import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";
import type { RequestHandler } from "./$types";
import type { ApprovedClue } from "$lib/types/clueTypes";

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

    // Path to the approved clues file - use environment-aware path
    const basePath = process.env.NODE_ENV === 'production' ? '/app/static' : 'static';
    const approvedCluesPath = path.resolve(basePath, "approved_clues.json");

    // Read existing approved clues
    let approvedClues: ApprovedClue[] = [];
    if (fs.existsSync(approvedCluesPath)) {
      approvedClues = JSON.parse(fs.readFileSync(approvedCluesPath, "utf-8"));
    }

    // Hash map to check for duplicates
    const existingCluesMap = new Map();
    approvedClues.forEach((clue) => {
      const key = `${clue.movieId}:${clue.clueText}`;
      existingCluesMap.set(key, true);
    });

    // Add new clues, skipping duplicates
    let newCluesAdded = 0;
    const timestamp = new Date().toISOString();

    data.clues.forEach((clue) => {
      const key = `${clue.movieId}:${clue.clueText}`;

      // Skip if already exists
      if (existingCluesMap.has(key)) {
        return;
      }

      // Add new clue with generated ID
      const clueId = `${clue.movieId}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Create the new approved clue with all fields
      const newClue: ApprovedClue = {
        id: clueId,
        movieId: clue.movieId,
        movieTitle: clue.movieTitle,
        movieYear: clue.movieYear,
        clueText: clue.clueText,
        approvedAt: timestamp,
      };

      // Add optional fields if they exist
      if (clue.rating !== undefined) newClue.rating = clue.rating;
      if (clue.is_liked !== undefined) newClue.is_liked = clue.is_liked;
      if (clue.reviewer) newClue.reviewer = clue.reviewer;
      if (clue.reviewUrl) newClue.reviewUrl = clue.reviewUrl;

      // Log the new clue being added
      console.log("Adding new clue:", JSON.stringify(newClue, null, 2));

      approvedClues.push(newClue);
      existingCluesMap.set(key, true);
      newCluesAdded++;
    });

    // Write back to the file
    fs.writeFileSync(
      approvedCluesPath,
      JSON.stringify(approvedClues, null, 2),
      "utf-8"
    );

    // Log a sample of what was written
    console.log(
      "Sample of approved clues after save:",
      JSON.stringify(approvedClues.slice(-newCluesAdded), null, 2)
    );

    return json({
      success: true,
      message: `Added ${newCluesAdded} new clues.`,
      approvedCount: approvedClues.length,
    });
  } catch (error) {
    console.error("Error processing batch clue approval:", error);
    return json({ success: false, error: "Server error" }, { status: 500 });
  }
};
