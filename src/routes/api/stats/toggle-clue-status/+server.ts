// routes\api\stats\toggle-clue-status\+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApprovedClue, RejectedClue } from '$lib/types/clueTypes';
import { readStaticFile, writeStaticFile } from '$lib/utils/fileHelper';

interface ToggleRequest {
  clue: ApprovedClue | RejectedClue;
  currentStatus: 'approved' | 'rejected';
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { clue, currentStatus } = await request.json() as ToggleRequest;
    
    if (!clue || !clue.id || !currentStatus) {
      return json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    // Read the files using our helper functions
    let approvedClues: ApprovedClue[] = [];
    let rejectedClues: RejectedClue[] = [];

    try {
      approvedClues = readStaticFile("approved_clues.json");
    } catch (error) {
      console.log("No existing approved_clues.json, starting with empty array");
      approvedClues = [];
    }

    try {
      rejectedClues = readStaticFile("rejected_clues.json");
    } catch (error) {
      console.log("No existing rejected_clues.json, starting with empty array");
      rejectedClues = [];
    }

    // Perform the status toggle
    if (currentStatus === "approved") {
      // Move from approved to rejected
      const clueToMove = approvedClues.find((c) => c.id === clue.id);

      if (!clueToMove) {
        return json(
          { success: false, error: "Clue not found in approved list" },
          { status: 404 }
        );
      }

      // Remove from approved
      approvedClues = approvedClues.filter((c) => c.id !== clue.id);

      // Add to rejected with current timestamp
      rejectedClues.push({
        ...clueToMove,
        rejectedAt: new Date().toISOString(),
      } as RejectedClue);
    } else if (currentStatus === "rejected") {
      // Move from rejected to approved
      const clueToMove = rejectedClues.find((c) => c.id === clue.id);

      if (!clueToMove) {
        return json(
          { success: false, error: "Clue not found in rejected list" },
          { status: 404 }
        );
      }

      // Remove from rejected
      rejectedClues = rejectedClues.filter((c) => c.id !== clue.id);

      // Add to approved with current timestamp
      approvedClues.push({
        ...clueToMove,
        approvedAt: new Date().toISOString(),
      } as ApprovedClue);
    } else {
      return json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Write the updated files using our helper
    writeStaticFile("approved_clues.json", approvedClues);
    writeStaticFile("rejected_clues.json", rejectedClues);

    return json({
      success: true,
      message: `Clue ${
        currentStatus === "approved" ? "rejected" : "approved"
      } successfully`,
    });
  } catch (error) {
    console.error('Error toggling clue status:', error);
    return json({ success: false, error: "Server error" }, { status: 500 });
  }
};