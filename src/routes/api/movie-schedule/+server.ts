// routes/api/movie-schedule/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { ensureArray } from '$lib/utils/dataHelpers';

interface Movie {
    id: string;
    title: string;
    year: string | number;
    director: string;
    rating: string | number;
    genres: string[];
    actors: string[];
    poster_path: string;
    is_liked: boolean;
}

interface MovieWithDate extends Movie {
    scheduledDate: string;
}

// Get a date-based seed for consistent daily movie selection
function getDailyMovieSeed(): string {
    const now = new Date();
    // Format as YYYY-MM-DD to change daily
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Get a deterministic random number from a string seed
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Normalize to 0-1 range (& 0x7fffffff to remove sign bit)
    return (hash & 0x7fffffff) / 0x7fffffff;
}

// Get the poster path - fixed to correctly handle edge cases
function getPosterPath(movie: Movie): string | null {
  if (!movie) return null;
  
  // Convert movie title to filename format - handle special characters properly
  const titleFormatted = movie.title
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "_");
  const year = movie.year;
  return `/posters/${titleFormatted}_${year}.jpg`;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Get a future date N days from today in YYYY-MM-DD format
function getFutureDate(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Get or create today's scheduled movie
async function getDailyMovie() {
    try {
        // First, check if we already have a scheduled movie for today
        const today = getTodayDate();
        const { data: scheduledMovie, error: scheduleError } = await supabase
            .from('movie_schedule')
            .select('movie_id')
            .eq('date', today)
            .single();
        
        // If we already have a scheduled movie, return its ID
        if (scheduledMovie && !scheduleError) {
            console.log(`Using existing scheduled movie ID ${scheduledMovie.movie_id} for today (${today})`);
            return scheduledMovie.movie_id;
        }
        
        console.log(`No movie scheduled for today (${today}), selecting a new one`);
        
        // Get movies with clue counts in a single query
        const { data: moviesWithClueCount, error: moviesError } = await supabase
            .from('movies')
            .select(`
                *,
                clueCount:movie_clues(count)
            `);
        
        if (moviesError) {
            console.error('Error fetching movies:', moviesError);
            return null;
        }
        
        // Filter movies with at least 6 approved clues
        const eligibleMovies = moviesWithClueCount
            .map(movie => {
                // Extract the count from the nested count object
                const clueCount = movie.clueCount?.length > 0 ? movie.clueCount[0].count : 0;
                return { ...movie, clueCount };
            })
            .filter(movie => movie.clueCount >= 6);
        
        if (eligibleMovies.length === 0) {
            console.error('No eligible movies found with at least 6 clues');
            return null;
        }
        
        // Get a deterministic random value from the daily seed
        const dailySeed = getDailyMovieSeed();
        const randomValue = seededRandom(dailySeed);
        
        // Select movie based on the random value
        const dailyIndex = Math.floor(randomValue * eligibleMovies.length);
        const selectedMovie = eligibleMovies[dailyIndex];
        
        console.log(`Selected movie "${selectedMovie.title}" (ID: ${selectedMovie.id}) for today`);
        
        // Save this selection to the database for future requests
        const { error: insertError } = await supabase
            .from('movie_schedule')
            .insert([{
                date: today,
                movie_id: selectedMovie.id,
                created_at: new Date().toISOString()
            }]);
        
        if (insertError) {
            console.error('Error saving movie schedule:', insertError);
        }
        
        return selectedMovie.id;
    } catch (error) {
        console.error('Error in getDailyMovie:', error);
        return null;
    }
}

// Get or schedule upcoming movies for the next N days
async function getUpcomingMovies(todayMovieId: string | number, days: number = 5) {
    try {
        const upcomingMovies = [];
        
        // Get movies with clue counts
        const { data: moviesWithClueCount, error: moviesError } = await supabase
            .from('movies')
            .select(`
                *,
                clueCount:movie_clues(count)
            `)
            .neq('id', todayMovieId);  // Exclude today's movie
        
        if (moviesError) {
            console.error('Error fetching movies for upcoming schedule:', moviesError);
            return [];
        }
        
        // Filter eligible movies
        const eligibleMovies = moviesWithClueCount
            .map(movie => {
                const clueCount = movie.clueCount?.length > 0 ? movie.clueCount[0].count : 0;
                return { ...movie, clueCount };
            })
            .filter(movie => movie.clueCount >= 6);
        
        // Use deterministic shuffle for upcoming movies
        const shuffleSeed = getDailyMovieSeed() + "-upcoming";
        const shuffledMovies = [...eligibleMovies].sort(() => seededRandom(shuffleSeed) - 0.5);
        
        // Only take what we need
        const candidateMovies = shuffledMovies.slice(0, days);
        
        // Get dates for the next N days
        for (let i = 0; i < days; i++) {
            const date = getFutureDate(i + 1);
            
            // Check if we already have a movie scheduled for this date
            const { data: existing, error: existingError } = await supabase
                .from('movie_schedule')
                .select('movie_id')
                .eq('date', date)
                .single();
            
            if (!existingError && existing) {
                // We already have a movie scheduled for this date
                // Get the movie details
                const { data: scheduledMovie, error: movieError } = await supabase
                    .from('movies')
                    .select('*')
                    .eq('id', existing.movie_id)
                    .single();
                
                if (!movieError && scheduledMovie) {
                    // Process the movie and add it to upcoming
                    const processedMovie = {
                        ...scheduledMovie,
                        genres: ensureArray(scheduledMovie.genres),
                        actors: ensureArray(scheduledMovie.actors),
                        poster_path: getPosterPath(scheduledMovie),
                        scheduledDate: date
                    };
                    
                    upcomingMovies.push(processedMovie);
                }
            } else if (i < candidateMovies.length) {
                // No movie scheduled yet, use one from our candidates
                const movie = candidateMovies[i];
                
                // Schedule this movie for this date
                await supabase
                    .from('movie_schedule')
                    .insert([{
                        date: date,
                        movie_id: movie.id,
                        created_at: new Date().toISOString()
                    }]);
                
                // Process and add to upcoming list
                const processedMovie = {
                    ...movie,
                    genres: ensureArray(movie.genres),
                    actors: ensureArray(movie.actors),
                    poster_path: getPosterPath(movie),
                    scheduledDate: date
                };
                
                upcomingMovies.push(processedMovie);
            }
        }
        
        return upcomingMovies;
    } catch (error) {
        console.error('Error in getUpcomingMovies:', error);
        return [];
    }
}

export const GET: RequestHandler = async () => {
    try {
        // Cache control headers - short cache time of 15 minutes
        const headers = {
            'Cache-Control': 'public, max-age=900',
            'Expires': new Date(Date.now() + 900000).toUTCString()
        };
        
        // Get or create today's movie
        const todayMovieId = await getDailyMovie();
        
        if (!todayMovieId) {
            return json({
                todayMovie: null,
                upcomingMovies: []
            }, { headers });
        }
        
        // Fetch the complete movie details
        const { data: movieData, error: movieError } = await supabase
            .from('movies')
            .select('*')
            .eq('id', todayMovieId)
            .single();
        
        if (movieError || !movieData) {
            console.error('Error fetching movie details:', movieError);
            return json({ error: 'Failed to fetch movie details' }, { status: 500, headers });
        }
        
        // Process movie to ensure arrays are properly formatted
        const todayMovie = {
            ...movieData,
            genres: ensureArray(movieData.genres),
            actors: ensureArray(movieData.actors),
            poster_path: getPosterPath(movieData)
        };
        
        // Get upcoming movies
        const upcomingMovies = await getUpcomingMovies(todayMovieId);
        
        return json({
            todayMovie,
            upcomingMovies
        }, { headers });
    } catch (error: any) {
        console.error('Error generating movie schedule:', error);
        console.error('Error details:', error.message, error.stack);
        return json({ error: 'Failed to generate movie schedule' }, { status: 500 });
    }
};