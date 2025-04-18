// routes/api/movie-clues/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // Add cache control headers to ensure fresh data
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const movieId = url.searchParams.get('movieId');
    
    if (!movieId) {
      return json({ error: 'Movie ID is required' }, { status: 400, headers });
    }
    
    // Fetch clues for the specific movie
    const { data: clues, error } = await supabase
      .from('movie_clues')
      .select('*')
      .eq('movie_id', movieId);
    
    if (error) {
      console.error(`Error fetching clues for movie ${movieId}:`, error);
      return json({ error: 'Failed to fetch clues' }, { status: 500, headers });
    }
    
    // Log the number of clues found
    console.log(`Found ${clues?.length || 0} clues for movie ${movieId}`);
    
    // If fewer than 6 clues, fetch reviews and generate clues automatically
    if (!clues || clues.length < 6) {
      // Fetch the movie details first
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single();
      
      if (movieError || !movieData) {
        console.error(`Error fetching movie ${movieId}:`, movieError);
        return json(clues || [], { headers });
      }
      
      // Now fetch reviews for this movie
      const { data: reviews, error: reviewsError } = await supabase
        .from('movie_reviews')
        .select('*')
        .eq('movie_id', movieId);
      
      if (reviewsError || !reviews || reviews.length === 0) {
        console.error(`Error fetching reviews for movie ${movieId}:`, reviewsError);
        return json(clues || [], { headers });
      }
      
      // We have reviews but not enough clues - could implement auto-generation here
      // For now, just return what we have
      console.log(`Not enough clues for movie ${movieId} - has ${clues?.length || 0}, needs at least 6`);
    }
    
    return json(clues || [], { headers });
  } catch (error) {
    console.error(`Error fetching movie clues:`, error);
    return json({ error: 'Failed to fetch movie clues' }, { status: 500 });
  }
};