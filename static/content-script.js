/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */

const doReplaceInputs = (inputs, regex, replace) => {
	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		return replace;
	}

	for (const input of inputs) {
		try {
			input.value = input.value.replace(regex, replaceAndCount);
		} catch (e) {
			console.error('Error in doReplaceInputs:', e);
		}
	}

	return count;
}

function doReplaceInIframe(iframe, search, replace, textInputFields, webpage, color) {
	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		if (color) {
			return `<span class="xword-search-n-highlight" style="background-color: ${color.backgroundColor}; color: ${color.textColor}">${replace}<span>${count}</span></span>`;
		}
		return replace;
	}

	const iframeDocument = iframe.contentDocument?.documentElement;

	if (!iframeDocument) return count;

	try {
		// INFO: innerHTML's scope
		// * it retrieves the HTML content of the entire document's root element, which typically excludes the current values of input or textarea elements.
		// * it focuses on the initial, rendered HTML code, not dynamic user input.
		if (webpage) {
			const content = iframeDocument.innerHTML;
			iframeDocument.innerHTML = content.replace(search, replaceAndCount);
		}

		if (textInputFields) {
			// Replace words in iframes (input & textarea) if it has
			const inputElems = iframeDocument.getElementsByTagName('input');
			const textAreaElems = iframeDocument.getElementsByTagName('textarea');

			count += doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], search, replace);
		}
	} catch (e) {
		console.error('Error in doReplaceInIframe:', e);
	}

	return count;
}

// function searchAndReplace(item, textInputFields, webpage, isRegex, color) {
function searchAndReplace(item, searchConfig, color) {
	const { textInputFields, webpage, regex, matchCase } = searchConfig;
	const { search, replace } = item;

	const flag = matchCase ? 'g' : 'gi';
	item['searchRegex'] = new RegExp(search, flag);

	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		if (color) {
			return `<span class="xword-search-n-highlight" style="background-color: ${color.backgroundColor}; color: ${color.textColor}">${match}<span>${count}</span></span>`;
		}
		return replace;
	};

	const iframes = document.querySelectorAll('iframe');

	if (webpage) {
		// Replace words in the current document body
		const body = document.getElementsByTagName('body')[0];
		const searchValue = regex ? item.searchRegex : search;
		body.innerHTML = body.innerHTML.replace(searchValue, replaceAndCount);

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
		count += doReplaceInIframe(iframe, search, replace, textInputFields, webpage, color);
	}

	if (textInputFields && !color) {
		// INFO: Only replace words in input fields, no search and highlight for inputs
		const inputElems = document.getElementsByTagName('input');
		const textAreaElems = document.getElementsByTagName('textarea');
		count += doReplaceInputs([
			...inputElems,
			...textAreaElems,
		], search, replace);
	}

	return count;
}

async function doSearchAndReplace() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	// search and replace
	const result = {};
	for (const item of activeItems) {
		result[item.search] = searchAndReplace(item, searchConfig);
	}

	return result;
}

async function doSearchAndHighlight() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	// INFO: search and replace with highlight of the same text
	// The problem with this approach is that it can be in an infinite loop to search and replace the same text
	const result = {};
	for (const item of activeItems) {
		const color = {
			backgroundColor: item.backgroundColor,
			textColor: item.textColor,
		}
		result[item.search] = searchAndReplace(item, searchConfig, color);
	}

	return result;
}

// Listen for messages sent from service worker to the content-script
// The reason for messaging is that only the content-script can manipulate the DOM directly
// But the service worker can't access the DOM. Service worker works with the browser API directly.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// INFO: using async/await doesn't work correctly in this case of listener function
	if (message === 'searchAndReplaceInContentScript') {
		doSearchAndReplace().then(sendResponse);
	} else if (message === 'searchAndHighlightInContentScript') {
		doSearchAndHighlight().then(sendResponse);
	}

	// Return true to indicate that sendResponse will be called asynchronously
	return true;
});