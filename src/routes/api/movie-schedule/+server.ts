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
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// Get a deterministic random number from a string seed
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Normalize to 0-1 range
    return (hash & 0x7fffffff) / 0x7fffffff;
}

// Fix: Updated to point to the correct poster path
function getPosterPath(movie: Movie): string | null {
  if (!movie) return null;
  // Convert movie title to filename format
  const titleFormatted = movie.title.replace(/\s+/g, "_").replace(/[^\w\-]/g, "_");
  const year = movie.year;
  return `/posters/${titleFormatted}_${year}.jpg`;
}

export const GET: RequestHandler = async () => {
    try {
        // Cache control headers - cache for 1 hour since the daily movie only changes once per day
        const headers = {
            'Cache-Control': 'public, max-age=3600',
            'Expires': new Date(Date.now() + 3600000).toUTCString()
        };
        
        // Get movies with clue counts in a single query using Supabase's built-in count feature
        const { data: moviesWithClueCount, error: moviesError } = await supabase
            .from('movies')
            .select(`
                *,
                clueCount:movie_clues(count)
            `);
        
        if (moviesError) {
            console.error('Error fetching movies:', moviesError);
            return json({ error: 'Failed to fetch movies' }, { status: 500, headers });
        }
        
        // Process the movies to ensure arrays are properly formatted
        const processedMovies = moviesWithClueCount.map(movie => {
            // Extract the count from the nested count object
            const clueCount = movie.clueCount?.length > 0 ? movie.clueCount[0].count : 0;
            
            // Fix: Use ensureArray to properly parse JSONB arrays
            const genres = ensureArray(movie.genres);
            const actors = ensureArray(movie.actors);
            
            // Fix: Update poster_path to use the correct relative path
            const poster_path = getPosterPath(movie);
            
            return {
                ...movie,
                clueCount,
                genres,
                actors,
                poster_path
            };
        });
        
        // Filter movies with at least 6 approved clues
        let eligibleMovies = processedMovies.filter(movie => movie.clueCount >= 6);
        
        if (eligibleMovies.length === 0) {
            return json({
                todayMovie: null,
                upcomingMovies: []
            });
        }
        
        // Get today's daily movie using a date-based seed
        const dailySeed = getDailyMovieSeed();
        const randomValue = seededRandom(dailySeed);
        const dailyIndex = Math.floor(randomValue * eligibleMovies.length);
        
        // Select today's movie
        const todayMovie = eligibleMovies[dailyIndex];
        
        // Remove today's movie from the list and shuffle the rest for upcoming movies
        const remainingMovies = eligibleMovies.filter(movie => movie.id !== todayMovie.id);
        const shuffledRemaining = [...remainingMovies].sort(() => Math.random() - 0.5);
        const upcomingMovies = shuffledRemaining.slice(0, 5);
        
        // Generate dates for upcoming movies (starting from tomorrow)
        const upcomingMoviesWithDates: MovieWithDate[] = upcomingMovies.map((movie: any, index: number) => {
            const date = new Date();
            date.setDate(date.getDate() + index + 1);
            // Ensure upcoming movies also have correct poster paths
            const poster_path = getPosterPath(movie);
            return {
                ...movie,
                scheduledDate: date.toISOString().split('T')[0],
                poster_path
            };
        });
        
        return json({
            todayMovie,
            upcomingMovies: upcomingMoviesWithDates
        }, { headers });
    } catch (error: any) {
        console.error('Error generating movie schedule:', error);
        console.error('Error details:', error.message, error.stack);
        return json({ error: 'Failed to generate movie schedule' }, { status: 500 });
    }
};