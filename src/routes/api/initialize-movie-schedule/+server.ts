// Updated code for routes/api/initialize-movie-schedule/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get parameters from request body
    const body = await request.json();
    const { keepToday = true, dayCount = 365 } = body; // Default to a year of movies
    
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    console.log(`Initializing schedule starting from ${todayString}`);
    
    // First, clear any existing schedule
    const { error: clearError } = await supabase
      .from('movie_schedule')
      .delete()
      .gte('date', todayString);
    
    if (clearError) {
      console.error('Error clearing existing schedule:', clearError);
      return json({ success: false, error: 'Failed to clear existing schedule' }, { status: 500 });
    }
    
    // Get all eligible movies (with at least 6 clues)
    const { data: moviesWithClueCount, error: moviesError } = await supabase
      .from('movies')
      .select(`
        id,
        title,
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
      return json({ 
        success: false, 
        error: 'No eligible movies found with sufficient clues' 
      }, { status: 400 });
    }
    
    console.log(`Found ${eligibleMovies.length} eligible movies with at least 6 clues`);
    
    // Create a shuffled copy of eligible movies
    // Use a deterministic seed based on the date to ensure consistent but random order
    const seed = `schedule-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const randomSeed = getRandomSeed(seed);
    let shuffledMovies = [...eligibleMovies].sort(() => randomSeed() - 0.5);
    
    // Ensure we have enough movies for the desired schedule
    if (shuffledMovies.length < dayCount) {
      // We need to repeat some movies - make enough copies to fulfill the schedule
      const repeatsNeeded = Math.ceil(dayCount / shuffledMovies.length) - 1;
      for (let i = 0; i < repeatsNeeded; i++) {
        // Create a new shuffled copy each time to ensure good distribution
        const additionalMovies = [...eligibleMovies].sort(() => randomSeed() - 0.5);
        shuffledMovies = [...shuffledMovies, ...additionalMovies];
      }
    }
    
    // Take just the movies we need for the schedule
    const scheduledMovies = shuffledMovies.slice(0, dayCount);
    
    // Create the schedule entries
    const scheduleEntries = [];
    
    // Create entries for all dates
    for (let i = 0; i < dayCount; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      scheduleEntries.push({
        date: dateString,
        movie_id: scheduledMovies[i].id,
        created_at: new Date().toISOString()
      });
    }
    
    // Insert all schedule entries - use UPSERT instead of INSERT to handle conflicts
    const { error: insertError } = await supabase
      .from('movie_schedule')
      .upsert(scheduleEntries);
    
    if (insertError) {
      console.error('Error creating schedule:', insertError);
      return json({ success: false, error: 'Failed to create schedule' }, { status: 500 });
    }
    
    // Return success message
    return json({
      success: true,
      message: `Created schedule for ${scheduleEntries.length} days using ${eligibleMovies.length} unique movies`,
      startDate: todayString,
      endDate: scheduleEntries[scheduleEntries.length - 1].date,
      movieCount: eligibleMovies.length,
      dayCount: scheduleEntries.length
    });
  } catch (error) {
    console.error('Error initializing movie schedule:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};

// Get a deterministic random number generator based on a seed
function getRandomSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  
  // Create a simple random number generator using the hash
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}