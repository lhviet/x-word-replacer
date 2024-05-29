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

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
