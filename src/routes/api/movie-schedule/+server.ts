// routes\api\movie-schedule\+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readStaticFile } from '$lib/utils/fileHelper';

interface Clue {
    id: string;
    movieId: string;
    movieTitle: string;
    movieYear: string;
    clueText: string;
    approvedAt: string;
}

interface Movie {
    id: string;
    title: string;
    year: string;
    director: string;
    genres: string[];
    cast: string[];
    rating: number;
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

// Load used movie IDs from localStorage (server-side compatible)
function getUsedMovieIds(): string[] {
    try {
        // Since this is a server-side function, we can't directly access localStorage
        // In a real implementation, this would use a database or server-side storage
        // For this example, we'll return an empty array to avoid filtering out any movies
        return [];
    } catch (error) {
        console.error('Error loading used movie IDs:', error);
        return [];
    }
}

export const GET: RequestHandler = async ({ request }) => {
    try {
        let approvedClues: Clue[] = [];
        let moviesData: Movie[] = [];
        
        // Read the approved clues using our helper
        try {
            approvedClues = readStaticFile('approved_clues.json');
        } catch (error) {
            console.error('Failed to load approved_clues.json:', error);
            approvedClues = [];
        }
        
        // Read the movies data using our helper
        try {
            moviesData = readStaticFile('letterboxd_movies.json');
        } catch (error) {
            console.error('Failed to load letterboxd_movies.json:', error);
            return json({ 
                error: 'Failed to load movie data',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
        
        // Count clues per movie
        const cluesPerMovie: Record<string, number> = {};
        approvedClues.forEach((clue: Clue) => {
            if (!cluesPerMovie[clue.movieId]) {
                cluesPerMovie[clue.movieId] = 0;
            }
            cluesPerMovie[clue.movieId]++;
        });
        
        // Get the list of movie IDs that have been used before
        const usedMovieIds = getUsedMovieIds();
        
        // Filter movies with at least 6 approved clues that haven't been used before
        let eligibleMovies = moviesData.filter((movie: Movie) => {
            const movieId = movie.id || `${movie.title}-${movie.year}`;
            return cluesPerMovie[movieId] && cluesPerMovie[movieId] >= 6;
        });
        
        if (eligibleMovies.length === 0) {
            return json({
                todayMovie: null,
                upcomingMovies: []
            });
        }
        
        // Get today's daily movie using a date-based seed (same approach as in gameStore.ts)
        const dailySeed = getDailyMovieSeed();
        const randomValue = seededRandom(dailySeed);
        const dailyIndex = Math.floor(randomValue * eligibleMovies.length);
        
        // Select today's movie
        const todayMovie = eligibleMovies[dailyIndex];
        
        // Remove today's movie from the list and shuffle the rest for upcoming movies
        // Get today's movie ID (either from the ID field or generate one from title+year)
        const todayMovieId = todayMovie.id || `${todayMovie.title}-${todayMovie.year}`;
        
        // Remove today's movie from the list and shuffle the rest for upcoming movies
        const remainingMovies = eligibleMovies.filter(movie => {
            const movieId = movie.id || `${movie.title}-${movie.year}`;
            return movieId !== todayMovieId;
        });
        const shuffledRemaining = [...remainingMovies].sort(() => Math.random() - 0.5);
        const upcomingMovies = shuffledRemaining.slice(0, 5);
        
        // Generate dates for upcoming movies (starting from tomorrow)
        const upcomingMoviesWithDates: MovieWithDate[] = upcomingMovies.map((movie: Movie, index: number) => {
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