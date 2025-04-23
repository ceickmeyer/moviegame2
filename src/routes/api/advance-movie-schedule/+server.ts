// routes/api/advance-movie-schedule/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async () => {
  try {
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    // First, check if there's a scheduled movie for tomorrow
    const { data: tomorrowMovie, error: tomorrowError } = await supabase
      .from('movie_schedule')
      .select('movie_id')
      .eq('date', tomorrowString)
      .single();
    
    if (tomorrowError && tomorrowError.code !== 'PGRST116') { // Not found error code
      console.error('Error checking tomorrow\'s movie:', tomorrowError);
      return json({ success: false, error: 'Failed to check upcoming movies' }, { status: 500 });
    }
    
    let nextMovieId: string | number;
    
    // If no movie is scheduled for tomorrow, we need to generate one
    if (!tomorrowMovie) {
      // Get all eligible movies
      const { data: moviesWithClueCount, error: moviesError } = await supabase
        .from('movies')
        .select(`
          id,
          clueCount:movie_clues(count)
        `);
      
      if (moviesError) {
        console.error('Error fetching movies:', moviesError);
        return json({ success: false, error: 'Failed to fetch eligible movies' }, { status: 500 });
      }
      
      // Filter to movies with enough clues
      const eligibleMovies = moviesWithClueCount
        .map(movie => {
          const clueCount = movie.clueCount?.length > 0 ? movie.clueCount[0].count : 0;
          return { ...movie, clueCount };
        })
        .filter(movie => movie.clueCount >= 6);
      
      if (eligibleMovies.length === 0) {
        return json({ success: false, error: 'No eligible movies found' }, { status: 400 });
      }
      
      // Get current movie to avoid selecting it again
      const { data: currentMovie } = await supabase
        .from('movie_schedule')
        .select('movie_id')
        .eq('date', todayString)
        .single();
      
      // Filter out the current movie
      const availableMovies = eligibleMovies.filter(m => 
        !currentMovie || m.id !== currentMovie.movie_id
      );
      
      if (availableMovies.length === 0) {
        return json({ success: false, error: 'No other eligible movies available' }, { status: 400 });
      }
      
      // Randomly select a new movie
      const randomIndex = Math.floor(Math.random() * availableMovies.length);
      nextMovieId = availableMovies[randomIndex].id;
    } else {
      // Use the movie already scheduled for tomorrow
      nextMovieId = tomorrowMovie.movie_id;
      
      // Delete tomorrow's entry since we're using it today
      const { error: deleteError } = await supabase
        .from('movie_schedule')
        .delete()
        .eq('date', tomorrowString);
      
      if (deleteError) {
        console.error('Error deleting tomorrow\'s schedule:', deleteError);
        return json({ success: false, error: 'Failed to remove tomorrow\'s schedule' }, { status: 500 });
      }
    }
    
    // Update today's entry with the next movie
    const { error: updateError } = await supabase
      .from('movie_schedule')
      .update({ movie_id: nextMovieId })
      .eq('date', todayString);
    
    if (updateError) {
      console.error('Error updating today\'s movie:', updateError);
      return json({ success: false, error: 'Failed to update schedule' }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      message: 'Movie schedule advanced successfully' 
    });
  } catch (error) {
    console.error('Error advancing movie schedule:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};