import { getCurrentTab } from '$lib/chrome-helper/tab';

// INFO: using async/await doesn't work correctly in this case of listener function
chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse) {
		const handler = sender.tab ? handleMessageFromContentScript : handleMessageFromExtension;
		handler(message, sender, sendResponse).then(sendResponse);

		// Return true to indicate that sendResponse will be called asynchronously
		return true;
	}
);

async function handleMessageFromContentScript(message, sender, sendResponse) {
	// console.log('handleMessageFromContentScript:', message);
	if (message === 'searchAndReplace') {
		// doSearchAndReplace().then(sendResponse);
		const response = await chrome.tabs.sendMessage(sender.tab.id, 'searchAndReplaceInContentScript');
		return response;
	} else if (message === 'searchAndHighlight') {
		// doSearchAndHighlight().then(sendResponse);
		const response = await chrome.tabs.sendMessage(sender.tab.id, 'searchAndHighlightInContentScript');
		return response;
	}
}

// INFO: from the extension, i.e., background script or popup
async function handleMessageFromExtension(message, sender, sendResponse) {
	// console.log('handleMessageFromExtension:', message);
	if (message === 'searchAndReplace') {
		const tab = await getCurrentTab();
		if (tab && tab.id) {
			const response = await chrome.tabs.sendMessage(tab.id, 'searchAndReplaceInContentScript');
			return response;
		}
	} else if (message === 'searchAndHighlight') {
		const tab = await getCurrentTab();
		if (tab && tab.id) {
			const response = await chrome.tabs.sendMessage(tab.id, 'searchAndHighlightInContentScript');
			return response;
		}
	}
}