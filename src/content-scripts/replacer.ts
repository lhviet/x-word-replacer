import * as utils from './utils';
import {
	type HighlightResult,
	type SearchConfig,
	type SearchReplace,
	type SearchResult,
} from '$lib/stores';
import { throttle } from '$utils/throttle';

function searchAndReplace(item, searchConfig) {
	const { textInputFields, webpage, regex, matchCase, html } = searchConfig;
	const { search, replace } = item;

	// using an object to hold the highlightResult globally, that is used in recursive functions
	const highlightResult: HighlightResult = {
		matches: new Set(),
		total: 0,
	};

	const searchRegex = utils.getSearchRegex(search, searchConfig);
	if (!searchRegex) {
		return highlightResult;
	}

	const body = document.body;

	if (!html) {
		// Replace words in the current document body by checking each DOM Element Node
		utils.replaceTextWithElement(highlightResult, body, searchRegex, replace, textInputFields, webpage);
	} else {
		if (webpage) {
			const replaceAndCount = (match) => {
				highlightResult.matches.add(match.toString());
				highlightResult.total++;
				return replace;
			};
			// Replace words in the current document body
			body.innerHTML = body.innerHTML.replace(searchRegex, replaceAndCount);
		}

		// Replace words in the current document body by using innerHTML
		const iframes = document.querySelectorAll('iframe');
		for (const iframe of iframes) {
			const iframeResult = utils.doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage);

			highlightResult.matches = new Set([...highlightResult.matches, ...iframeResult.matches]);
			highlightResult.total += iframeResult.total;
		}

		if (textInputFields) {
			// INFO: Only replace words in input fields, no search and highlight for inputs
			const inputElems = document.getElementsByTagName('input');
			const textAreaElems = document.getElementsByTagName('textarea');
			const inputResult = utils.doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], searchRegex, replace);

			highlightResult.matches = new Set([...highlightResult.matches, ...inputResult.matches]);
			highlightResult.total += inputResult.total;
		}
	}

	return highlightResult;
}

function searchAndHighlight(activeItems: SearchReplace[], searchConfig: SearchConfig) {
	const { textInputFields, webpage, html } = searchConfig;

	// using an object to hold the count searchResult globally, that is used in recursive functions
	const searchResult: SearchResult = {};

	if (html) {
		// Replace words in the current document body by modifying innerHTML to include highlight dom elements
		for (const item of activeItems) {
			const searchRegex = utils.getSearchRegex(item.search, searchConfig);
			if (!searchRegex) {
				continue;
			}

			const color = utils.getItemColor(item);
			const { search, replace } = item;

			searchResult[search] = { matches: new Set(), total: 0 };

			if (webpage) {
				// Replace words in the current document body using innerHTML
				const replaceAndCount = (match) => {
					searchResult[search].matches.add(match.toString());
					searchResult[search].total++;

					return utils.getColorHTMLElement(color, searchResult[search], match, replace);
				};
				document.body.innerHTML = document.body.innerHTML.replace(searchRegex, replaceAndCount);
			}

			// processing iframes
			const iframes = document.querySelectorAll('iframe');
			for (const iframe of iframes) {
				const iframeResult = utils.doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color);
				searchResult[search].matches = new Set([...searchResult[search].matches, ...iframeResult.matches]);
				searchResult[search].total += iframeResult.total;
			}
		}
	}
	else {
		// No matter webpage or textInputFields, we highlight the text in the current document body
		// Replace words in the current document body by checking each DOM Element Node
		for (const item of activeItems) {
			searchResult[item.search] = searchResult[item.search] || { matches: new Set(), total: 0 };
		}
		utils.highlightWithCanvas(searchResult, document.body, activeItems, searchConfig);
	}

	return searchResult;
}

export async function getActiveSearchReplaceItems() {
	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const activeItems = searchReplace.filter(item => item.active && item.search.length > 0);

	return { activeItems, searchConfig };
}

export async function doSearchAndReplace() {
	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

	// Create an array of promises for parallel execution
	const promises = activeItems.map(async item => {
		const highlightResult = await searchAndReplace(item, searchConfig);
		return { search: item.search, ...highlightResult };
	});

	// Await all promises to resolve
	const results = await Promise.all(promises);

	// Construct the result object
	const result = {};
	results.forEach(({ search, matches, total }) => {
		result[search] = {
			matches: Array.from(matches),
			total
		};
	});

	return result;
}

export async function doSearchAndHighlight() {
	// console.log('doSearchAndHighlight is called.');
	stopObserving();  // Temporarily disconnect the observer to avoid infinite loop

	// INFO: Remove the existing highlighting canvas if it exists, to redraw the highlights freshly
	// The use case is if DOM is updated, we redraw new findings correctly
	for (const c of document.body.getElementsByClassName('xword-highlight-canvas')) {
		c.remove();
	}

	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

	const searchResult: SearchResult = searchAndHighlight(activeItems, searchConfig);
	// console.log('doSearchAndHighlight result:', result);

	startObserving();

	const result = {}
	for (const [key, value] of Object.entries(searchResult)) {
		result[key] = { matches: Array.from(value.matches), total: value.total };
	}
	return result;
}

// Continuous highlighting ------------------------------

// INFO: Initial Throttle Limit: Start with a throttle limit of 600ms.
// Periodic Check: Every 6 seconds, check if the function has been called more than 8 times.
// Increase Throttle: If the function is called more than 3 times in 5 seconds, increase the throttle limit to FIVE_SECONDS.
// Reset Throttle: After 30 seconds from increasing the throttle limit, reset it back to 600ms and continue the checking process.
const FIVE_SECONDS = 5000;
const SIX_SECONDS = 6000;
const THIRTY_SECONDS = 30000;
const CALL_LIMIT = 8;
let callTimestamps: number[] = [];
let throttleLimit = 600;
let isThrottled = false;
let increaseThrottleTimeout;
let resetThrottleTimeout;

let observer: MutationObserver;

function checkCallFrequency() {
	// Remove timestamps older than SIX_SECONDS
	callTimestamps = callTimestamps.filter(timestamp => Date.now() - timestamp <= SIX_SECONDS);

	// Check if there have been more than CALL_LIMIT calls in the last SIX_SECONDS
	if (callTimestamps.length > CALL_LIMIT && !isThrottled) {
		// Increase the throttle limit to FIVE_SECONDS
		throttleLimit = FIVE_SECONDS;
		isThrottled = true;
		throttledSearchReplace = setupThrottledHighlight(throttleLimit);
		// console.log("Throttle limit increased to FIVE_SECONDS");

		// Reset the throttle limit to 600 ms after THIRTY_SECONDS
		resetThrottleTimeout = setTimeout(() => {
			throttleLimit = 600;
			isThrottled = false;
			throttledSearchReplace = setupThrottledHighlight(throttleLimit);
			// console.log("Throttle limit reset to 600 ms");
		}, THIRTY_SECONDS);
	}

	// Schedule the next check in SIX_SECONDS
	increaseThrottleTimeout = setTimeout(checkCallFrequency, SIX_SECONDS);
}

// Throttle the doSearchAndHighlight function
function setupThrottledHighlight(milliseconds: number) {
	return throttle(() => {
		const now = Date.now();
		// Add current timestamp
		callTimestamps.push(now);

		doSearchAndHighlight();
	}, milliseconds);
}
let throttledSearchReplace = setupThrottledHighlight(throttleLimit);

// Start the periodic check
checkCallFrequency();

const startObserving = () => {
	observer?.observe(document.body, {
		attributes: true,	// Monitor attribute changes in Element, i.e., display style, position, etc.
		childList: true,	// Monitor child changes in Element, i.e., adding or removing child nodes
		subtree: true,	// Monitor all descendants of the target node
		characterData: true,	// Monitor text changes in TextNode
	});
}

export const stopObserving = () => {
	observer?.disconnect();
}

export async function continuousHighlight() {
	// console.log('Continuous highlighting is enabled.');
	window.addEventListener('load', () => throttledSearchReplace());
	document.addEventListener('DOMContentLoaded', () => throttledSearchReplace());

	// INFO: we don't monitor the network request because DOM observer seems good enough for this use case
	observer = new MutationObserver(() => {
		// console.log('DOM mutation detected.');
		throttledSearchReplace();
	});
	startObserving();
}