import preprocess from "svelte-preprocess";
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	package: {
		exports(filepath) {
			return filepath.endsWith("package.json") || filepath.endsWith("index.ts");
		},
	},

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: null,
		}),

		appDir: 'app',  // default is _app, the chrome extension will detect _ as private directory and will not working

	}
};

export default config;
