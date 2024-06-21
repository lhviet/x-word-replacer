import * as utils from './utils';

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

export async function getActiveSearchReplaceItems() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	return { activeItems, searchConfig };
}

export async function doSearchAndReplace() {
	const result = {};

	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

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

export async function doSearchAndHighlight(observer?: MutationObserver) {
	const result = {};

	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

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

	observer?.observe(document.body, { childList: true, subtree: true });
	return result;
}

export async function continuousHighlight() {
	const throttledSearchReplace = utils.throttle(doSearchAndHighlight, 500);
	// INFO: we don't monitor the network request because DOM observer seems good enough for this use case
	const observer = new MutationObserver(() => {
		observer.disconnect();  // Temporarily disconnect the observer to avoid infinite loop
		throttledSearchReplace(observer);
	});
	observer.observe(document.body, { childList: true, subtree: true });

	window.addEventListener('load', throttledSearchReplace);
	document.addEventListener('DOMContentLoaded', throttledSearchReplace);
}