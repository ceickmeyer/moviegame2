import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Adding adapter options for Vercel
      runtime: 'nodejs18.x', // Specify the runtime
      split: false // Generate a single function with all routes
    }),
    paths: {
      base: "", // This should match your Vercel project's base path
    },
    // Keep the assets mapping as-is
    files: {
      assets: 'static'
    }
  },
};
export default config;