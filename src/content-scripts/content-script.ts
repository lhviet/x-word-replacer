/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */
import './styles.scss';

import {
	continuousHighlight,
	doSearchAndReplace,
	doSearchAndHighlight,
	getActiveSearchReplaceItems
} from './replacer';

// Listen for messages sent from service worker to the content-script
// The reason for messaging is that only the content-script can manipulate the DOM directly
// But the service worker can't access the DOM. Service worker works with the browser API directly.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// INFO: using async/await doesn't work correctly in this case of listener function
	if (message === 'searchAndReplaceInContentScript') {
		// console.log('searchAndReplaceInContentScript is called.');
		doSearchAndReplace().then(sendResponse);
	} else if (message === 'searchAndHighlightInContentScript') {
		// console.log('searchAndHighlightInContentScript is called.');
		doSearchAndHighlight().then(sendResponse);
	}

	// Return true to indicate that sendResponse will be called asynchronously
	return true;
});

getActiveSearchReplaceItems().then(async ({ searchConfig }) => {
	if (searchConfig?.autoHighlight) {
		continuousHighlight();
	}
});
