// routes/api/movie-schedule/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

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

export const GET: RequestHandler = async () => {
    try {
        // Get all movies from Supabase
        const { data: moviesData, error: moviesError } = await supabase
            .from('movies')
            .select('*');
        
        if (moviesError) {
            console.error('Error fetching movies:', moviesError);
            return json({ error: 'Failed to fetch movies' }, { status: 500 });
        }
        
        // For each movie, get the count of clues
// Update the code where you process movie data
const moviesWithClueCount = await Promise.all(moviesData.map(async (movie) => {
    const { count, error: countError } = await supabase
      .from('movie_clues')
      .select('*', { count: 'exact', head: true })
      .eq('movie_id', movie.id);
    
    // Ensure genres and actors are arrays
    const genres = movie.genres ? 
      (Array.isArray(movie.genres) ? movie.genres : 
       (typeof movie.genres === 'string' ? movie.genres.split(',') : 
        (typeof movie.genres === 'object' ? Object.values(movie.genres) : []))) : [];
        
    const actors = movie.actors ? 
      (Array.isArray(movie.actors) ? movie.actors : 
       (typeof movie.actors === 'string' ? movie.actors.split(',') : 
        (typeof movie.actors === 'object' ? Object.values(movie.actors) : []))) : [];
    
    return {
      ...movie,
      clueCount: count || 0,
      genres: genres,
      actors: actors
    };
  }));
        
        // Filter movies with at least 6 approved clues
        let eligibleMovies = moviesWithClueCount.filter(movie => movie.clueCount >= 6);
        
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
            return {
                ...movie,
                scheduledDate: date.toISOString().split('T')[0]
            };
        });
        
        return json({
            todayMovie,
            upcomingMovies: upcomingMoviesWithDates
        });
    } catch (error: any) {
        console.error('Error generating movie schedule:', error);
        console.error('Error details:', error.message, error.stack);
        return json({ error: 'Failed to generate movie schedule' }, { status: 500 });
    }
};