import { supabase } from './supabaseClient';
import type { Movie } from './utils/sentenceExtractor';
import type { ApprovedClue } from './types/clueTypes';

export async function getMovies(): Promise<Movie[]> {
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*');

  if (error) {
    console.error('Error fetching movies:', error);
    return [];
  }

  return movies.map(movie => ({
    ...movie,
    genres: Array.isArray(movie.genres) ? movie.genres : (movie.genres ? movie.genres.split(',') : []),
    actors: Array.isArray(movie.actors) ? movie.actors : (movie.actors ? movie.actors.split(',') : []),
    reviews: [] // Reviews will be loaded separately
  }));
}

export async function getMovieReviews(movieId: string) {
  const { data: reviews, error } = await supabase
    .from('movie_reviews')  // Assuming you have a movie_reviews table
    .select('*')
    .eq('movie_id', movieId);

  if (error) {
    console.error('Error fetching reviews for movie ' + movieId + ':', error);
    return [];
  }

  return reviews;
}

export async function getApprovedClues(): Promise<ApprovedClue[]> {
  const { data: clues, error } = await supabase
    .from('movie_clues')
    .select('*');

  if (error) {
    console.error('Error fetching approved clues:', error);
    return [];
  }

  return clues.map(clue => ({
    id: clue.id,
    movieId: clue.movie_id,
    movieTitle: clue.movie_title,
    movieYear: clue.movie_year,
    clueText: clue.clue_text,
    approvedAt: clue.approved_at,
    rating: clue.rating,
    is_liked: clue.is_liked,
    reviewer: clue.reviewer,
    reviewUrl: clue.review_url
  }));
}

export async function approveClue(clue: any): Promise<void> {
  const { error } = await supabase
    .from('movie_clues')
    .insert([{
      id: clue.id || `${clue.movieId}-${Date.now()}`,
      movie_id: clue.movieId,
      movie_title: clue.movieTitle,
      movie_year: clue.movieYear,
      clue_text: clue.clueText,
      approved_at: new Date().toISOString(),
      rating: clue.rating,
      is_liked: clue.is_liked,
      reviewer: clue.reviewer || 'Anonymous',
      review_url: clue.reviewUrl || ''
    }]);

  if (error) {
    console.error('Error approving clue:', error);
    throw new Error('Failed to approve clue');
  }
}

export async function rejectClue(clueId: string): Promise<void> {
  const { error } = await supabase
    .from('movie_clues')
    .delete()
    .eq('id', clueId);

  if (error) {
    console.error('Error rejecting clue:', error);
    throw new Error('Failed to reject clue');
  }
}

export async function addClue(clue: any): Promise<void> {
  const { error } = await supabase
    .from('movie_clues')
    .insert([{
      id: `${clue.movieId}-${Date.now()}`,
      movie_id: clue.movieId,
      movie_title: clue.movieTitle,
      movie_year: clue.movieYear,
      clue_text: clue.clueText,
      approved_at: new Date().toISOString(),
      rating: clue.rating,
      is_liked: clue.is_liked,
      reviewer: clue.reviewer || 'Anonymous',
      review_url: clue.reviewUrl || ''
    }]);

  if (error) {
    console.error('Error adding clue:', error);
    throw new Error('Failed to add clue');
  }
}