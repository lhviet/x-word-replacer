export async function getCurrentTab() {
	// INFO: this function is used in the background script and popup only, not for content-script
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	return tab;
}
