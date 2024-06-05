## Logic

![Logic](diagrams/x-word-replacer.drawio.svg)

To structure the content scripts source code, there are two script files are used:
* `content.js` - This script is defined in the manifest file and is executed when the extension is activated. This script is responsible for injecting the `content-script.js` into the active tab.
* `utils.js` - this script is defined as a resource in the manifest file, for dynamic loading in the `content-script.js` script.

```
"web_accessible_resources": [{
    "matches": ["<all_urls>"],
    "resources": ["utils.js"]
  }],
```

## Building

To create a production version of your app:

```bash
npm run build
```

### Service Worker
To sendMessage correctly, we need to disable auto-registering the service worker in the `svelte.config.js` file.
```js
serviceWorker: {
    register: false
}
```
* https://kit.svelte.dev/docs/service-workers
* https://www.reddit.com/r/sveltejs/comments/vvn38e/question_serviceworker_messages_in_sveltekit/

## Setup
### Tailwind CSS
* https://tailwindcss.com/docs/guides/sveltekit

### shadcn-svelte Components
* Install
    * https://shadcn-svelte.com/docs/installation/sveltekit
* Add components
    * https://shadcn-svelte.com/docs/components/accordion