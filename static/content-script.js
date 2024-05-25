/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */
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

// Helper function to escape special characters in a string for regex
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
// INFO: this function is used when we want to convert a normal string, that may contain
// special characters, i.e., dot `.`, into a regex string. In that case, to keep the dot as a dot,
// we need to escape it. I.e., `.` -> `\.`
const RegExEscape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper function to test if a string is a valid regex
function isValidRegex(searchText) {
	try {
		new RegExp(searchText);
		return true;
	} catch (e) {
		console.warn('Invalid regex:', searchText, e);
	}
	return false;
}

// Helper function to get the HTML element with the highlight color as a string
const getColorHTMLElement = (highlightColor, count, searchValue, replaceValue) => {
	if (!highlightColor) {
		return replaceValue;
	}
	return `<span class="xword-search-n-highlight" style="background-color: ${highlightColor.backgroundColor}; color: ${highlightColor.textColor}">${searchValue}<span style="user-select: none;">${count}</span></span>`;
}

// Helper function to convert HTML string to DOM element
function htmlToElement(html) {
	let template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template.content.firstChild;
}

const doReplaceInputs = (inputs, searchRegex, replace) => {
	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		return replace;
	}

	for (const input of inputs) {
		try {
			input.value = input.value.replace(searchRegex, replaceAndCount);
		} catch (e) {
			console.error('Error in doReplaceInputs:', e);
		}
	}

	return count;
}

function doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color) {
	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		return getColorHTMLElement(color, count, match, replace);
	}

	const iframeDocument = iframe.contentDocument?.documentElement;

	if (!iframeDocument) return count;

	try {
		// INFO: innerHTML's scope
		// * it retrieves the HTML content of the entire document's root element, which typically excludes the current values of input or textarea elements.
		// * it focuses on the initial, rendered HTML code, not dynamic user input.
		if (webpage) {
			const content = iframeDocument.innerHTML;
			iframeDocument.innerHTML = content.replace(searchRegex, replaceAndCount);
		}

		if (textInputFields) {
			// Replace words in iframes (input & textarea) if it has
			const inputElems = iframeDocument.getElementsByTagName('input');
			const textAreaElems = iframeDocument.getElementsByTagName('textarea');

			count += doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], searchRegex, replace);
		}
	} catch (e) {
		console.error('Error in doReplaceInIframe:', e);
	}

	return count;
}

function searchAndReplace(item, searchConfig, color = undefined) {
	const { textInputFields, webpage, regex, matchCase, html } = searchConfig;
	const { search, replace } = item;

	const flag = matchCase ? 'g' : 'gi';

	// INFO: if we use regex, we should not escape the regex, because users may want to use regex
	// But if we use normal text, we should escape it to avoid special characters in the text, i.e., dot `.`
	//   and use the escaped text as a regex, i.e., `.` -> `\.`
	const regexStr = regex ? search : RegExEscape(search);
	if (!isValidRegex(regexStr)) {
		return 0;
	}
	const searchRegex = new RegExp(regexStr, flag);

	// using an object to hold the count result globally, that is used in recursive functions
	const result = { count: 0 };

	const body = document.getElementsByTagName('body')[0];

	if (!html) {
		// Replace words in the current document body by checking each DOM Element Node
		replaceTextWithElement(result, body, searchRegex, replace, textInputFields, webpage, color);

	} else {
		const replaceAndCount = (match) => {
			result.count++;
			return getColorHTMLElement(color, result.count, match, replace);
		};
		// Replace words in the current document body by using innerHTML
		const iframes = document.querySelectorAll('iframe');

		if (webpage) {
			// Replace words in the current document body
			body.innerHTML = body.innerHTML.replace(searchRegex, replaceAndCount);
		}

		for (const iframe of iframes) {
			result.count += doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color);
		}

		if (textInputFields && !color) {
			// INFO: Only replace words in input fields, no search and highlight for inputs
			const inputElems = document.getElementsByTagName('input');
			const textAreaElems = document.getElementsByTagName('textarea');
			result.count += doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], searchRegex, replace);
		}
	}

	return result.count;
}

async function doSearchAndReplace() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	// search and replace
	const result = {};
	for (const item of activeItems) {
		// count the number of replacements for each search term
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

/**
 * INFO: a DOM element can be an element node, a text node, or an attribute node,
 * i.e., h1Elem = <h1>Research Overview</h1> has a Text node "overview", if we check h1Elem.childNodes[0].nodeType it will return 3
 * Therefore, if we want to replace a mere text by an HTML element, i.e., replace `Overview` by `<span>Overview</span>`
 *  using innerHTML directly: h1Elem.childNodes[0].innerHTML = 'Research <span>Overview</span>' will not work.
 * To make it works, we need to create new elements and merge them.
 * In the example above, we need to create a new text node for `Research` and a new span element for `Overview` and append them to h1Elem.
 * Then, remove the old node.
 * Example usage
 * let element = document.getElementById('plugins-overview');
 * replaceTextWithElement(element, 'Overview', 'span');
 */
function replaceTextWithElement(resultObj, elementNode, regexSearchValue, replaceValue, searchTextInputs, webpage, color = undefined) {
	// Iterate through all child nodes of the element and search or replace text with the given regex searchValue

	// if color is provided, it means users want to highlight text, and highlighting doesn't apply to input fields
	const shouldProcessInputs = searchTextInputs && !color;

	// INFO: we should use Array.from to convert NodeList to Array to avoid the live NodeList
	// It means that if we update/remove a child from the NodeList, the NodeList will be updated.
	const childrenNodes = Array.from(elementNode.childNodes);

	for (let i = 0; i < childrenNodes.length; i++) {
		const child = childrenNodes[i];

		if (child.nodeType === Node.ELEMENT_NODE) {
			// Handle input and textarea elements
			const tagName = child.tagName.toLowerCase();
			if (tagName === 'input' || tagName === 'textarea') {
				if (!shouldProcessInputs) {
					// Do nothing if users want to highlight the text (search), instead of replace it
					continue;
				}
				child.value = child.value.replace(regexSearchValue, replaceValue);
				// TODO: Handle input and textarea elements with highlight (search results to be shown to users against a regex/search)
			}
			// Update iframe elements
			else if (child.tagName.toLowerCase() === 'iframe') {
				try {
					let iframeDoc = child.contentDocument || child.contentWindow.document;
					replaceTextWithElement(resultObj, iframeDoc.body, regexSearchValue, replaceValue, searchTextInputs, webpage, color);
				} catch (e) {
					console.error('Cannot access iframe contents:', e);
				}

			} else {
				// Recursively call the function on child elements
				replaceTextWithElement(resultObj, child, regexSearchValue, replaceValue, searchTextInputs, webpage, color);
			}
		}
		else if (webpage && child.nodeType === Node.TEXT_NODE) {
			const text = child.nodeValue;

			if (color) {  // Replace with HTML element
				// Split text into parts based on the search regex
				// i.e., this text = 'an object with output generation such an object.'
				// can be splited into 4 parts of 3 matches with this regex = /\bo\w{5}\b/gi
				const parts = text.split(regexSearchValue);
				const matches = text.match(regexSearchValue) || [];

				// Iterate through the parts and matches to create new elements
				for (let i = 0; i < parts.length; i++) {
					const partText = parts[i];
					if (partText) {
						elementNode.insertBefore(document.createTextNode(partText), child);
					}
					if (i < matches.length) {
						// append the replaceElement if this part of text is not the last one
						resultObj.count++;
						const replaceStr = getColorHTMLElement(color, resultObj.count, matches[i], replaceValue);
						const replaceElement = htmlToElement(replaceStr);
						elementNode.insertBefore(replaceElement.cloneNode(true), child);
					}
				}
				child.remove(); // Remove the original text node

			} else {
				// Replace with plain text
				child.nodeValue = text.replace(regexSearchValue, replaceValue);
			}
		}
	}
}
