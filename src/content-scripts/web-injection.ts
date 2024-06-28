import styles from '../styles.scss?inline';
import FloatingButton from '$lib/components/FloatingBtn';
import { Brush } from 'lucide-svelte';

import {
	doSearchAndHighlight,
} from './replacer';

// Create shadow root
const host = document.body;
if (!host) {
	console.warn('Could not find body host for Ultra Notes');
	throw new Error('Could not find body host');
}

function init() {
	// console.log('Document loaded');
	// console.log('Found a body host for Ultra Notes');

	// Create a container inside the shadow root
	const container = document.createElement('div');
	container.id = 'x-word-replacer';
	host.append(container);

	const shadow = container.attachShadow({ mode: 'open' });

	const styleElement = document.createElement('style');
	styleElement.textContent = styles;
	shadow.appendChild(styleElement);

	const target = document.createElement("div");
	target.style.fontFamily = 'Open Sans, sans-serif';
	shadow.append(target);

	const btn = new FloatingButton({
		target,
		props: { icon: Brush },
	});

	btn.$on('click', (event) => {
		// console.log('Button clicked!');
		doSearchAndHighlight();
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
