import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';

export const GET = async ({ url }: RequestEvent) => {
  try {
    const dataType = url.searchParams.get('type');
    
    if (!dataType || (dataType !== 'approved' && dataType !== 'movies')) {
      return json({ error: 'Invalid data type requested' }, { status: 400 });
    }
    
    // Use different approaches for dev vs production
    if (process.env.NODE_ENV === 'production') {
      // In production (Vercel), files are served from /static/
      const filePath = dataType === 'approved'
        ? '/static/approved_clues.json'
        : '/static/letterboxd_movies.json';
      const { default: data } = await import(filePath, { assert: { type: 'json' } });
      return json(data);
    } else {
      // In development, read files directly
      const filePath = join(process.cwd(), 'static',
        dataType === 'approved' ? 'approved_clues.json' : 'letterboxd_movies.json');
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      return json(data);
    }
  } catch (error) {
    console.error(`Error fetching ${url.searchParams.get('type')} data:`, error);
    return json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};