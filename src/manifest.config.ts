import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json';

const { version, description } = packageJson;

export default defineManifest(async (env) => ({
	manifest_version: 3,
	name: 'X Word Replacer',
	description: description,
	version: version,
	version_name: version,
	permissions: ['storage'],
	icons: {
		128: 'static/favicon.png'
	},
	content_scripts: [
		{
			matches: ['<all_urls>'],
			js: [
				'src/content-scripts/content-script.ts',
				// "src/main.ts",
			]
		}
	],
	background: {
		service_worker: 'src/service-worker.ts'
	},
	action: {
		default_popup: 'src/index.html'
	},
	web_accessible_resources: [{
		matches: ['<all_urls>'],
		resources: [
			'static/images/icon_128.png',
			'static/images/ultra-notes.png'
		]
	}],
	content_security_policy: {
		'extension_pages': 'script-src \'self\' \'wasm-unsafe-eval\'; object-src \'self\';'
	}
}));
