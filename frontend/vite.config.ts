import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
//import routify from '@roxi/routify/plugins'
import preprocess from "svelte-preprocess";

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
      svelte({
        preprocess: [preprocess()],
      }),
  ],
})
