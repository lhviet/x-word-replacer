// Allows users to open the side panel by clicking on the action toolbar icon

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onConnect.addListener(async (port) => {
	if (port.name === 'sidePanelPort') {
		port.onDisconnect.addListener(() => {
			// Cleaning data work here
			cleanDocs();
			// TODO: Save docs before quit
			// When deleting a note, remember to update the path of its NoteContent
		});
		port.onMessage.addListener(async (msg) => {
			if (msg.action === "CleanDocs") {
				// Cleaning data work here
				cleanDocs();
			}
		});
	}
});

const cleanDocs = async () => {
	// This function should be called when the app is loaded (open) or unloaded (close)
	// check if metadata without content --> remove
	// check if content without metadata --> remove
	let { note: sNote, noteContent: sContent } = await chrome.storage.sync.get(['note', 'noteContent']);

	if (!sNote) sNote = {};
	for (const path in sNote) {
		if (!sContent[path]) {
			delete sNote[path];
			delete sContent[path];
		}
	}

	if (!sContent) sContent = {};
	for (const path in sContent) {
		if (!sNote[path]) {
			delete sNote[path];
			delete sContent[path];
		}
	}

	await chrome.storage.sync.set({ note: sNote, noteContent: sContent });
}