import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { UserConfig } from 'vite';
import path from 'path';
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config";

const config: UserConfig = {
  plugins: [
    svelte({
      emitCss: false,
    }),
    crx({ manifest }),
  ],

  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      $utils: path.resolve('./src/utils')
    }
  },

  // HACK: https://github.com/crxjs/chrome-extension-tools/issues/696
  // https://github.com/crxjs/chrome-extension-tools/issues/746
  /*server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },*/

};

export default config;