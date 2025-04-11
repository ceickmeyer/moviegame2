import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Remove the runtime specification or use a supported one
      // Vercel automatically selects an appropriate Node.js version
    }),
    paths: {
      base: ""
    },
    files: {
      assets: 'static'
    }
  },
};
export default config;

