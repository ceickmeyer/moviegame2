import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';
import type { ApprovedClue, RejectedClue } from '$lib/types/clueTypes';

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

    // Path to the clue files
    const approvedCluesPath = path.resolve("static/approved_clues.json");
    const rejectedCluesPath = path.resolve("static/rejected_clues.json");

    // Read the files
    let approvedClues: ApprovedClue[] = [];
    let rejectedClues: RejectedClue[] = [];

    if (fs.existsSync(approvedCluesPath)) {
      approvedClues = JSON.parse(fs.readFileSync(approvedCluesPath, "utf-8"));
    }

    if (fs.existsSync(rejectedCluesPath)) {
      rejectedClues = JSON.parse(fs.readFileSync(rejectedCluesPath, "utf-8"));
    } else {
      // Create the rejected clues file if it doesn't exist
      fs.writeFileSync(rejectedCluesPath, JSON.stringify([], null, 2), "utf-8");
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

    // Write the updated files
    fs.writeFileSync(
      approvedCluesPath,
      JSON.stringify(approvedClues, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      rejectedCluesPath,
      JSON.stringify(rejectedClues, null, 2),
      "utf-8"
    );

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