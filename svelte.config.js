import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Use default Vercel adapter options
    }),
    // Make sure this is just an empty string
    paths: {
      base: ""
    },
    // Keep assets pointing to static directory
    files: {
      assets: 'static'
    }
  },
};
export default config;