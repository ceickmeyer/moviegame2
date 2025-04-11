// routes\api\clues-data\+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { readStaticFile } from '$lib/utils/fileHelper';

export const GET = async ({ url }: RequestEvent) => {
  try {
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400 });
    }

    try {
      // Use our improved helper function
      const fileName = dataType === 'approved' 
        ? 'approved_clues.json' 
        : 'letterboxd_movies.json';
      
      const data = readStaticFile(fileName);
      return json(data);
    } catch (error) {
      console.error(`Error reading ${dataType} file:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};