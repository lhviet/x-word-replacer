import FloatingButton from '$lib/components/FloatingBtn';
import { Brush } from 'lucide-svelte';
import MainUI from '$lib/MainUI';

function createShadowDomButton() {
	// Create the shadow host
	const host = document.createElement('div');
	document.body.appendChild(host);

	// Create the shadow DOM
	const shadow = host.attachShadow({mode: 'open'});

	// Create a container for our Svelte component
	const container = document.createElement('div');
	shadow.appendChild(container);

	// Create styles
	/*const style = document.createElement('style');
	style.textContent = `
    :host {
      all: initial;
    }
  `;
	shadow.appendChild(style);*/

	// Render the Svelte component
	/*new FloatingButton({
		target: host,
		props: {
			// icon: Brush,
		}
	});*/
	new MainUI({
		target: host,
		props: {
		},
	});
}

// Automatically create the button when the page is fully loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', createShadowDomButton);
} else {
	createShadowDomButton();
}
