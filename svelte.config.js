import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Vercel adapter configuration
      runtime: 'nodejs18.x',
      // Enable Vercel's edge functions if needed
      // edge: true,
    })
  }
};

export default config;