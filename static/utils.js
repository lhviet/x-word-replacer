export const getActiveSearchReplaceItems = async () => {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	return { activeItems, searchConfig };
}

// Helper function to escape special characters in a string for regex
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
// INFO: this function is used when we want to convert a normal string, that may contain
// special characters, i.e., dot `.`, into a regex string. In that case, to keep the dot as a dot,
// we need to escape it. I.e., `.` -> `\.`
export const RegExEscape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper function to test if a string is a valid regex
export function isValidRegex(searchText) {
	try {
		new RegExp(searchText);
		return true;
	} catch (e) {
		console.warn('Invalid regex:', searchText, e);
	}
	return false;
}

// Helper function to get the HTML element with the highlight color as a string
export const getColorHTMLElement = (highlightColor, count, searchValue, replaceValue) => {
	if (!highlightColor) {
		return replaceValue;
	}
	const { backgroundColor , textColor } = highlightColor;

	return `<span class="xword-search-n-highlight" style="background-color: ${backgroundColor}; color: ${textColor}">${searchValue}<span  class='x-word-count'>${count}</span></span>`;
}

// Helper function to convert HTML string to DOM element
export function htmlToElement(html) {
	const template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;

	return template.content.firstChild;
}

export function doReplaceInputs(inputs, searchRegex, replace) {
	let count = 0;
	const replaceAndCount = (match) => {
		count++;
		return replace;
	}

	for (const input of inputs) {
		try {
			input.value = input.value.replace(searchRegex, replaceAndCount);
		} catch (e) {
			console.warn('Failed in doReplaceInputs:', e);
		}
	}

	return count;
}

export function doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color) {
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
		console.warn('Failed in doReplaceInIframe:', e);
	}

	return count;
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
export function replaceTextWithElement(resultObj, elementNode, regexSearchValue, replaceValue, searchTextInputs, webpage, color = undefined) {
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
					console.warn('Cannot access iframe contents:', e);
				}

			} else if (child) {
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

				// Check if this whole text node (parent) matches the search value and the (parent) node is highlighted already
				if (
					matches.length === 1 && matches[0] === text
					&& child.parentElement.classList.contains('xword-search-n-highlight')
				) {
					continue;
				}

				// Iterate through the parts and matches to create new elements
				for (let i = 0; i < parts.length; i++) {
					const partText = parts[i];
					try {
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
					catch (e) {
						console.warn('Failed to replace text with element:', e);
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

export function throttle(func, limit) {
	let lastFunc;
	let lastRan;

	return function(...args) {
		const context = this;

		if (!lastRan) {
			func.apply(context, args);
			lastRan = Date.now();
		} else {
			if (lastFunc) {
				clearTimeout(lastFunc);
			}

			lastFunc = setTimeout(function() {
				if ((Date.now() - lastRan) >= limit) {
					func.apply(context, args);
					lastRan = Date.now();
				}
			}, limit - (Date.now() - lastRan));
		}
	};
}
