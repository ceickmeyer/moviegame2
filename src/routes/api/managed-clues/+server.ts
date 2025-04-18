// routes/api/managed-clues/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // Add cache control headers to ensure fresh data
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // Extract pagination and search parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Base query
    let query = supabase
      .from('movie_clues')
      .select('*', { count: 'exact' });
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`movie_title.ilike.%${search}%,clue_text.ilike.%${search}%`);
    }
    
    // Get total count first
    const { count, error: countError } = await query;
    
    if (countError) {
      console.error('Error getting clue count:', countError);
      return json({ error: 'Failed to get clue count' }, { status: 500, headers });
    }
    
    // Now get paginated data
    const { data: clues, error: cluesError } = await query
      .order('approved_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (cluesError) {
      console.error('Error fetching clues:', cluesError);
      return json({ error: 'Failed to fetch clues' }, { status: 500, headers });
    }
    
    // Process clues for client format
    const formattedClues = clues?.map(clue => ({
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
    })) || [];
    
    console.log(`Returning ${formattedClues.length} clues (page ${page}, limit ${limit}, total ${count})`);
    
    return json({
      clues: formattedClues,
      total: count || 0,
      page,
      limit
    }, { headers });
    
  } catch (error) {
    console.error('Error in managed-clues API:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};