import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ url }: RequestEvent) => {
  try {
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400 });
    }
    
    // For Vercel, we'll use dynamic imports from the static directory
    if (dataType === 'approved') {
      const { default: approvedClues } = await import('$lib/../../static/approved_clues.json', {
        assert: { type: 'json' }
      });
      return json(approvedClues);
    } else {
      const { default: movies } = await import('$lib/../../static/letterboxd_movies.json', {
        assert: { type: 'json' }
      });
      return json(movies);
    }
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};