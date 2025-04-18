// routes/api/clues-data/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { Movie } from '$lib/utils/sentenceExtractor';
import type { ApprovedClue } from '$lib/types/clueTypes';
import { ensureArray, parseJsonbField } from '$lib/utils/dataHelpers';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // Add cache control headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400, headers });
    }
    
    if (dataType === 'approved') {
      // Fetch approved clues from Supabase
      const { data: clues, error } = await supabase
        .from('movie_clues')
        .select('*');
      
      if (error) {
        console.error('Error fetching approved clues:', error);
        return json({ error: 'Failed to fetch approved clues' }, { status: 500, headers });
      }
      
      // Transform to match the expected format in the frontend
      const approvedClues = clues.map(clue => ({
        id: clue.id,
        movieId: clue.movie_id,
        movieTitle: clue.movie_title,
        movieYear: clue.movie_year,
        clueText: clue.clue_text,
        approvedAt: clue.approved_at,
        rating: clue.rating ? Number(clue.rating) : undefined,
        is_liked: !!clue.is_liked,
        reviewer: clue.reviewer || 'Anonymous',
        reviewUrl: clue.review_url || '',
        is_approved: true
      }));
      
      return json(approvedClues, { headers });
    } else { // dataType === 'movies'
      // Fetch movies from Supabase
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*');
      
      if (error) {
        console.error('Error fetching movies:', error);
        return json({ error: 'Failed to fetch movies' }, { status: 500 });
      }
      
      console.log(`Fetched ${movies?.length || 0} movies from Supabase`);
      
      // Transform to match the expected format
      const transformedMovies: Movie[] = await Promise.all(movies.map(async (movie) => {
        // Convert the integer ID to string to match what's expected
        const movieIdString = movie.id.toString();
        
        // Explicitly fetch reviews for this movie from the movie_reviews table
        const { data: reviews, error: reviewsError } = await supabase
          .from('movie_reviews')
          .select('*')
          .eq('movie_id', movie.id);
        
        if (reviewsError) {
          console.error(`Error fetching reviews for movie ${movie.id}:`, reviewsError);
        }
        
        console.log(`Movie ${movie.title} (ID: ${movie.id}): ${reviews?.length || 0} reviews found`);
        
        // Process JSON fields properly
        const genres = parseJsonbField(movie.genres);
        const actors = parseJsonbField(movie.actors);
        
        return {
          id: movieIdString,
          title: movie.title,
          year: movie.year,
          director: movie.director,
          rating: movie.rating ? Number(movie.rating) : undefined,
          genres: genres,
          actors: actors,
          is_liked: !!movie.is_liked,
          poster_path: movie.poster_path,
          reviews: (reviews || []).map(review => ({
            text: review.text,
            rating: review.rating ? Number(review.rating) : undefined,
            is_liked: !!review.is_liked,
            author: review.author || null,
            url: review.url
          }))
        };
      }));
      
      // Final check of transformed data
      const moviesWithReviews = transformedMovies.filter(m => m.reviews && m.reviews.length > 0);
      console.log(`After transformation: ${moviesWithReviews.length} movies have reviews`);
      
      return json(transformedMovies, { headers });
    }
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};