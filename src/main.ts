import MainUI from '$lib/MainUI';
import styles from './styles.scss?inline';

// Create shadow root
const host = document.body;
if (!host) {
	console.warn('Could not find body host for Ultra Notes');
	throw new Error('Could not find body host');
}

const init = () => {
	console.info('Document loaded');

	console.info('Found a body host for Ultra Notes');

	// Create a container inside the shadow root
	const container = document.createElement('div');
	container.id = 'x-word-replacer';
	container.style.width = '600px';
	container.style.height = '500px';
	container.style.position = 'absolute';
	container.style.right = '100px';
	container.style.top = '100px';
	document.body.append(container);

	// host.appendChild(container);

	// TODO: To use Shadow DOM, uncomment the following lines and modify code to load the app inside the shadow root
	const shadow = container.attachShadow({ mode: 'open' });

	const styleElement = document.createElement('style');
	styleElement.textContent = styles;
	shadow.appendChild(styleElement);

	const target = document.createElement("div");
	target.style.fontFamily = 'Open Sans, sans-serif';
	target.style.backgroundColor = 'rgba(204, 233, 217, 0.75)';
	target.style.height = '100%';
	shadow.append(target);

	new MainUI({
		target,
		props: {
		},
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
