/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */
const RegExEscape = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const doReplaceInputs = (inputs, regex, replace) => {
	for (const input of inputs) {
		try {
			input.value = input.value.replace(regex, replace);
		} catch (e) {
			console.error('Error in doReplaceInputs:', e);
		}
	}
}

function doReplaceInIframe(iframe, search, replace, textInputFields, webpage) {
	const iframeDocument = iframe.contentDocument?.documentElement;

	if (!iframeDocument) return;

	try {
		// INFO: innerHTML's scope
		// * it retrieves the HTML content of the entire document's root element, which typically excludes the current values of input or textarea elements.
		// * it focuses on the initial, rendered HTML code, not dynamic user input.
		if (webpage) {
			const content = iframeDocument.innerHTML;
			iframeDocument.innerHTML = content.replace(search, replace);
		}

		if (textInputFields) {
			// Replace words in iframes (input & textarea) if it has
			const inputElems = iframeDocument.getElementsByTagName('input');
			const textAreaElems = iframeDocument.getElementsByTagName('textarea');

			doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], search, replace);
		}
	} catch (e) {
		console.error('Error in doReplaceInIframe:', e);
	}
}

function searchAndReplace(search, replace, textInputFields, webpage) {
	const iframes = document.querySelectorAll('iframe');

	if (webpage) {
		// Replace words in the current document body
		const body = document.getElementsByTagName('body')[0];
		body.innerHTML = body.innerHTML.replace(search, replace);

		// INFO: Replace words outside the document body
		// * it's not recommended to replace words outside the document body, because it can break the page
		/*const allElements = document.getElementsByTagName('*');
		for (let i = 0; i < allElements.length; i++) {
			if (!allElements[i].tagName.match('/HEAD|SCRIPT|BODY|STYLE|IFRAME/')) {
				if (!allElements[i].innerHTML.match('<iframe([\s\S]*|.*)</iframe>')) {
					allElements[i].innerHTML = allElements[i].innerHTML.replace(search, replace);
				}
			}
		}*/
	}

	for (const iframe of iframes) {
		doReplaceInIframe(iframe, search, replace, textInputFields, webpage);
	}

	if (textInputFields) {
		// Replace words in the current document
		const inputElems = document.getElementsByTagName('input');
		const textAreaElems = document.getElementsByTagName('textarea');
		doReplaceInputs([
			...inputElems,
			...textAreaElems,
		], search, replace);
	}
}

async function doSearchAndReplace() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const { matchCase, regex, textInputFields, webpage } = searchConfig;
	const flag = matchCase ? 'g' : 'gi';

	const activeSearchArr = searchReplace.filter(item => item.active && item.search.length > 0);
	const searchRegexArr = activeSearchArr.map(item => ({
		searchRegex: new RegExp(
			!regex ? RegExEscape(item.search) : item.search,
			flag
		),
		...item,
	}));

	// search and replace
	for (const item of searchRegexArr) {
		searchAndReplace(item.searchRegex, item.replace, textInputFields, webpage);
	}
}

async function doSearchAndHighlight() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const { matchCase, regex, textInputFields, webpage } = searchConfig;
	const flag = matchCase ? 'g' : 'gi';

	const activeSearchArr = searchReplace.filter(item => item.active && item.search.length > 0);
	const searchRegexArr = activeSearchArr.map(item => ({
		searchRegex: new RegExp(
			!regex ? RegExEscape(item.search) : item.search,
			flag
		),
		...item,
	}));

	// INFO: search and replace with highlight of the same text
	// The problem with this approach is that it can be in an infinite loop to search and replace the same text
	for (let i = 0; i < searchRegexArr.length; i++) {
		const item = searchRegexArr[i];
		const replace = `<span class="xword-search-n-highlight" style="background-color: ${item.backgroundColor}; color: ${item.textColor}">${item.search}</span>`;
		// const replace = item.search;
		searchAndReplace(item.searchRegex, replace, textInputFields, webpage);
	}
}

// Listen for messages sent from service worker to the content-script
// The reason for messaging is that only the content-script can manipulate the DOM directly
// But the service worker can't access the DOM. Service worker works with the browser API directly.
chrome.runtime.onMessage.addListener(async (message) => {
	if (message === 'searchAndReplaceInContentScript') {
		await doSearchAndReplace();
	} else if (message === 'searchAndHighlightInContentScript') {
		await doSearchAndHighlight();
	}

	return;
});
