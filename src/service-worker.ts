async function getCurrentTab() {
	// Need the permission: activeTab
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	return tab;
}

// listening for messages sending from the Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// INFO: using async/await doesn't work correctly in this case of listener function
	getCurrentTab().then(tab => {
		if (!tab) {
			console.error('No active tab found. Please select a tab, refresh the page and try again.');
			return;
		}

		if (message === 'searchAndReplace') {
			chrome.tabs.sendMessage(tab.id, 'searchAndReplaceInContentScript', sendResponse);
		} else if (message === 'searchAndHighlight') {
			chrome.tabs.sendMessage(tab.id, 'searchAndHighlightInContentScript', sendResponse);
		}
	});

	// Return true to indicate that sendResponse will be called asynchronously
	return true;
});