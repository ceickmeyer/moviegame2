// routes/game/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    // Fetch the movie schedule (today's movie)
    const movieResponse = await fetch(`/api/movie-schedule?_=${Date.now()}`);
    const movieData = await movieResponse.json();
    
    if (!movieData.todayMovie) {
      return {
        error: 'No movie scheduled for today. At least 6 review clues are needed per movie.'
      };
    }
    
    // Get the movie ID
    const movieId = movieData.todayMovie.id || `${movieData.todayMovie.title}-${movieData.todayMovie.year}`;
    
    // Fetch clues for this movie
    const cluesResponse = await fetch(`/api/movie-clues?movieId=${movieId}&_=${Date.now()}`);
    const cluesData = await cluesResponse.json();
    
    // Fetch backdrop images
    const backdropResponse = await fetch('/api/backdrop-images');
    const backdropPaths = await backdropResponse.json();
    
    // Return all the data needed for the page
    return {
      todayMovie: movieData.todayMovie,
      clues: cluesData,
      backdropPaths: backdropPaths
    };
  } catch (error) {
    console.error('Error loading game data:', error);
    return {
      error: 'Failed to load game data'
    };
  }
};