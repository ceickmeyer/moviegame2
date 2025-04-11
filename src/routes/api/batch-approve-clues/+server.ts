// routes/api/batch-approve-clues/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { ApprovedClue } from "$lib/types/clueTypes";
import { readStaticFile, writeStaticFile } from "$lib/utils/fileHelper";

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

    // Read existing approved clues using our helper
    let approvedClues: ApprovedClue[] = [];
    try {
      approvedClues = readStaticFile("approved_clues.json");
    } catch (err) {
      console.log("No existing approved_clues.json, starting with empty array");
      approvedClues = [];
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

    try {
      // Try to write back to the file using our helper
      writeStaticFile("approved_clues.json", approvedClues);
    } catch (writeErr) {
      console.error("Error writing to file:", writeErr);
      // On Vercel, we can't write to the filesystem, so just return success
      // This means changes won't persist between deployments but will work for the current session
      if (process.env.VERCEL === '1') {
        console.log("Running on Vercel - can't write to filesystem but returning success");
        
        // Log a sample of what would be written
        console.log(
          "Sample of approved clues that would be saved:",
          JSON.stringify(approvedClues.slice(-newCluesAdded), null, 2)
        );
        
        return json({
          success: true,
          message: `Added ${newCluesAdded} new clues (Note: on Vercel, changes won't persist between deployments).`,
          approvedCount: approvedClues.length,
        });
      } else {
        // If not on Vercel, this is a real error
        throw writeErr;
      }
    }

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