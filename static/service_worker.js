async function getCurrentTab() {
	// Need the permission: activeTab
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	return tab;
}

// listening for messages sending from the Popup
chrome.runtime.onMessage.addListener(async (message) => {
	if (message !== 'searchAndReplace')
		return;

	const tab = await getCurrentTab();
	await chrome.tabs.sendMessage(tab.id, 'searchAndReplaceInContentScript');
});