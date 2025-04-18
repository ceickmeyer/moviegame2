// routes/api/debug-reviews/+server.ts
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async () => {
  try {
    // Get all movies
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title')
      .limit(10);
    
    if (moviesError) {
      return json({ error: 'Failed to fetch movies' }, { status: 500 });
    }
    
    // Get total review count
    const { count: totalReviews, error: countError } = await supabase
      .from('movie_reviews')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return json({ error: 'Failed to count reviews' }, { status: 500 });
    }
    
    // Get reviews for each movie
    const moviesWithReviewCounts = await Promise.all(movies.map(async (movie) => {
      const { data: reviews, error } = await supabase
        .from('movie_reviews')
        .select('id, text')
        .eq('movie_id', movie.id)
        .limit(3);
      
      return {
        movieId: movie.id,
        title: movie.title,
        reviewCount: reviews?.length || 0,
        reviewSamples: reviews?.map(r => r.id) || []
      };
    }));
    
    return json({
      totalMovies: movies.length,
      totalReviews,
      moviesWithReviewCounts
    });
  } catch (error) {
    return json({ error: 'Server error' }, { status: 500 });
  }
};