// routes/api/movie-reviews/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // Add cache control headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const movieId = url.searchParams.get('movieId');
    
    if (!movieId) {
      return json({ error: 'Movie ID is required' }, { status: 400, headers });
    }
    
    // Fetch reviews for the specific movie
    const { data: reviews, error } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', movieId);
    
    if (error) {
      console.error(`Error fetching reviews for movie ${movieId}:`, error);
      return json({ error: 'Failed to fetch reviews' }, { status: 500, headers });
    }
    
    // Log the number of reviews found
    console.log(`Found ${reviews?.length || 0} reviews for movie ${movieId}`);
    
    return json(reviews || [], { headers });
  } catch (error) {
    console.error(`Error fetching movie reviews:`, error);
    return json({ error: 'Failed to fetch movie reviews' }, { status: 500 });
  }
};