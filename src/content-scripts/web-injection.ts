import styles from '../styles.scss?inline';

import FloatingButton from '$lib/components/FloatingBtn';
import SidePanel from '$lib/components/SidePanel';
import MainUI from '$lib/MainUI';
import { WandSparkles } from 'lucide-svelte';
import { type AppState, appState } from '$lib/stores';
import { throttle } from '$utils/throttle';

import {
	doSearchAndHighlight,
} from './replacer';

// Create shadow root
const host = document.body;
if (!host) {
	console.warn('Could not find body host for Ultra Notes');
	throw new Error('Could not find body host');
}

function injectStyles(shadowRoot, styles) {
	const styleElement = document.createElement('style');
	styleElement.textContent = styles;
	shadowRoot.appendChild(styleElement);
}

async function init() {
	// console.log('Document loaded');
	// console.log('Found a body host for Ultra Notes');

	const { localAppConfig } = await chrome.storage.local.get(['localAppConfig']);
	if (!localAppConfig?.floatingBtn) {
		return;
	}

	// Create a container inside the shadow root
	const container = document.createElement('div');
	container.style.fontFamily = 'Open Sans, sans-serif';
	container.id = 'x-word-replacer';
	host.append(container);

	const shadow = container.attachShadow({ mode: 'closed' });

	injectStyles(shadow, styles);

	const buttonContainer = document.createElement('div');
	const panelContainer = document.createElement('div');
	shadow.appendChild(buttonContainer);
	shadow.appendChild(panelContainer);

	const handleClose = () => {
		container.remove();
	}

	const btn = new FloatingButton({
		target: buttonContainer,
		props: {
			icon: WandSparkles,
			onClose: handleClose,
		},
	});

	new SidePanel({
		target: panelContainer,
		props: {
			component: MainUI,
		}
	});

	const throttledBtnClick = throttle(() => {
		// console.log('Button clicked!');
		doSearchAndHighlight();
		appState.update((state: AppState) => ({ ...state, isPanelOpen: !state.isPanelOpen }));
	}, 500);

	btn.$on('click', throttledBtnClick);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

chrome.storage.local.onChanged.addListener((changes) => {
	if (changes?.localAppConfig?.newValue?.floatingBtn !== undefined) {
		if (!changes.localAppConfig.newValue.floatingBtn && document.getElementById('x-word-replacer')) {
			document.getElementById('x-word-replacer').remove();
			appState.update((state: AppState) => ({ ...state, isPanelOpen: false }));
		} else {
			init();
		}
	}
});
