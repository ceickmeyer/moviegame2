// routes/api/clues-data/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { Movie } from '$lib/utils/sentenceExtractor';
import type { ApprovedClue } from '$lib/types/clueTypes';

export const GET = async ({ url }: RequestEvent) => {
  try {
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400 });
    }
    
    if (dataType === 'approved') {
      // Fetch approved clues from Supabase
      const { data: clues, error } = await supabase
        .from('movie_clues')
        .select('*');
      
      if (error) {
        console.error('Error fetching approved clues:', error);
        return json({ error: 'Failed to fetch approved clues' }, { status: 500 });
      }
      
      // Transform to match the expected format in the frontend
      const approvedClues = clues.map(clue => ({
        id: clue.id,
        movieId: clue.movie_id,
        movieTitle: clue.movie_title,
        movieYear: clue.movie_year,
        clueText: clue.clue_text,
        approvedAt: clue.approved_at,
        rating: clue.rating,
        is_liked: clue.is_liked,
        reviewer: clue.reviewer,
        reviewUrl: clue.review_url,
        is_approved: true
      }));
      
      return json(approvedClues);
    } else { // dataType === 'movies'
      // Fetch movies from Supabase
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*');
      
      if (error) {
        console.error('Error fetching movies:', error);
        return json({ error: 'Failed to fetch movies' }, { status: 500 });
      }
      
      // Transform to match the expected format
      const transformedMovies: Movie[] = await Promise.all(movies.map(async (movie) => {
        // Get reviews for this movie
        const { data: reviews, error: reviewsError } = await supabase
          .from('movie_reviews')
          .select('*')
          .eq('movie_id', movie.id);
        
        if (reviewsError) {
          console.error(`Error fetching reviews for movie ${movie.id}:`, reviewsError);
        }
        
        return {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          director: movie.director,
          rating: movie.rating,
          genres: Array.isArray(movie.genres) ? movie.genres : (movie.genres ? movie.genres.split(',') : []),
          actors: Array.isArray(movie.actors) ? movie.actors : (movie.actors ? movie.actors.split(',') : []),
          is_liked: !!movie.is_liked,
          poster_path: movie.poster_path,
          reviews: (reviews || []).map(review => ({
            text: review.text,
            rating: review.rating,
            is_liked: !!review.is_liked,
            author: review.author,
            url: review.url
          }))
        };
      }));
      
      return json(transformedMovies);
    }
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};