async function getCurrentTab() {
	// Need the permission: activeTab
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	return tab;
}

// listening for messages sending from the Popup
chrome.runtime.onMessage.addListener(async (message) => {
	const tab = await getCurrentTab();
	if (message === 'searchAndReplace') {
		await chrome.tabs.sendMessage(tab.id, 'searchAndReplaceInContentScript');
	} else if (message === 'searchAndHighlight') {
		await chrome.tabs.sendMessage(tab.id, 'searchAndHighlightInContentScript');
	}
});