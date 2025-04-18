// routes/api/movie-suggestions/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // Add cache control headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const query = url.searchParams.get('query');
    
    if (!query || query.length < 1) {
      return json([], { headers });
    }
    
    // Fetch movies that match the query
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, year, director')
      .ilike('title', `%${query}%`)
      .limit(12);
    
    if (error) {
      console.error('Error searching movies:', error);
      return json({ error: 'Failed to search movies' }, { status: 500, headers });
    }
    
    // Format the results
    const formattedMovies = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      director: movie.director
    }));
    
    // Sort results by relevance - exact matches and starts-with matches first
    const sortedMovies = formattedMovies.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      if (aTitle === queryLower && bTitle !== queryLower) return -1;
      if (bTitle === queryLower && aTitle !== queryLower) return 1;
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
      if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;
      
      return aTitle.localeCompare(bTitle);
    });
    
    return json(sortedMovies, { headers });
  } catch (error) {
    console.error('Error in movie suggestions API:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};