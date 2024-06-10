export async function getCurrentTab() {
	// Need the permission: activeTab
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	return tab;
}