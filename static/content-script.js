/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */

(async () => {
	// retrieve resources defined in web_accessible_resources in manifest.json
	const src = chrome.runtime.getURL("/utils.js");
	const utils = await import(src);

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

	async function doSearchAndReplace() {
		const result = {};

		const { activeItems, searchConfig } = await utils.getActiveSearchReplaceItems();

		// Create an array of promises for parallel execution
		const promises = activeItems.map(async item => {
			const replacementCount = await searchAndReplace(item, searchConfig);
			return { search: item.search, replacementCount };
		});

		// Await all promises to resolve
		const results = await Promise.all(promises);

		// Construct the result object
		results.forEach(({ search, replacementCount }) => {
			result[search] = replacementCount;
		});

		return result;
	}

	async function doSearchAndHighlight() {
		const result = {};

		const { activeItems, searchConfig } = await utils.getActiveSearchReplaceItems();

		// Create an array of promises
		const promises = activeItems.map(async item => {
			const color = {
				backgroundColor: item.backgroundColor,
				textColor: item.textColor,
			};

			const replacementCount = await searchAndReplace(item, searchConfig, color);
			return { search: item.search, replacementCount };
		});

		// Await all promises to resolve
		const results = await Promise.all(promises);

		// Construct the result object
		results.forEach(({ search, replacementCount }) => {
			result[search] = replacementCount;
		});

		return result;
	}

	function searchAndReplace(item, searchConfig, color = undefined) {
		const { textInputFields, webpage, regex, matchCase, html } = searchConfig;
		const { search, replace } = item;

		const flag = matchCase ? 'g' : 'gi';

		// INFO: if we use regex, we should not escape the regex, because users may want to use regex
		// But if we use normal text, we should escape it to avoid special characters in the text, i.e., dot `.`
		//   and use the escaped text as a regex, i.e., `.` -> `\.`
		const regexStr = regex ? search : utils.RegExEscape(search);
		if (!utils.isValidRegex(regexStr)) {
			return 0;
		}
		const searchRegex = new RegExp(regexStr, flag);

		// using an object to hold the count result globally, that is used in recursive functions
		const result = { count: 0 };

		const body = document.getElementsByTagName('body')[0];

		if (!html) {
			// Replace words in the current document body by checking each DOM Element Node
			utils.replaceTextWithElement(result, body, searchRegex, replace, textInputFields, webpage, color);

		} else {
			const replaceAndCount = (match) => {
				result.count++;
				return utils.getColorHTMLElement(color, result.count, match, replace);
			};
			// Replace words in the current document body by using innerHTML
			const iframes = document.querySelectorAll('iframe');

			if (webpage) {
				// Replace words in the current document body
				body.innerHTML = body.innerHTML.replace(searchRegex, replaceAndCount);
			}

			for (const iframe of iframes) {
				result.count += utils.doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color);
			}

			if (textInputFields && !color) {
				// INFO: Only replace words in input fields, no search and highlight for inputs
				const inputElems = document.getElementsByTagName('input');
				const textAreaElems = document.getElementsByTagName('textarea');
				result.count += utils.doReplaceInputs([
					...inputElems,
					...textAreaElems,
				], searchRegex, replace);
			}
		}

		return result.count;
	}

	// when page is loaded
	if (document.readyState === 'complete') {
		doSearchAndHighlight();
	}
	else {
		document.onreadystatechange = async function () {
			if (document.readyState === "complete") {
				const { searchConfig } = await utils.getActiveSearchReplaceItems();
				const { autoHighlight } = searchConfig;
				if (autoHighlight) {
					console.info('Auto-highlighting...');
					doSearchAndHighlight();
				}
			}
		}
	}
})();

