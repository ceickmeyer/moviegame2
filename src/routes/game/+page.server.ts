// routes/game/+page.server.ts
import { json } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  try {
    // We'll just return success here because the actual data loading
    // happens through the API endpoints
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