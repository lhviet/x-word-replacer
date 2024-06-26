import * as utils from './utils';
import type { SearchConfig, SearchReplace } from '$lib/stores';

function searchAndReplace(item, searchConfig) {
	const { textInputFields, webpage, regex, matchCase, html } = searchConfig;
	const { search, replace } = item;

	const searchRegex = utils.getSearchRegex(search, searchConfig);
	if (!searchRegex) {
		return 0;
	}

	// using an object to hold the count result globally, that is used in recursive functions
	const result = { count: 0 };

	const body = document.body;

	if (!html) {
		// Replace words in the current document body by checking each DOM Element Node
		utils.replaceTextWithElement(result, body, searchRegex, replace, textInputFields, webpage);

	} else {
		if (webpage) {
			const replaceAndCount = (match) => {
				result.count++;
				return replace;
			};
			// Replace words in the current document body
			body.innerHTML = body.innerHTML.replace(searchRegex, replaceAndCount);
		}

		// Replace words in the current document body by using innerHTML
		const iframes = document.querySelectorAll('iframe');
		for (const iframe of iframes) {
			result.count += utils.doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage);
		}

		if (textInputFields) {
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

function searchAndHighlight(activeItems: SearchReplace[], searchConfig: SearchConfig) {
	const { textInputFields, webpage, html } = searchConfig;

	// using an object to hold the count result globally, that is used in recursive functions
	const result: any = {};

	if (html) {
		// Replace words in the current document body by modifying innerHTML to include highlight dom elements
		for (const item of activeItems) {
			const searchRegex = utils.getSearchRegex(item.search, searchConfig);
			if (!searchRegex) {
				continue;
			}

			const color = utils.getItemColor(item);
			const { search, replace } = item;

			if (webpage) {
				// Replace words in the current document body using innerHTML
				const replaceAndCount = (match: string) => {
					if (!result[search]) {
						result[search] = 0;
					}
					result[search]++;
					return utils.getColorHTMLElement(color, result[search], match, replace);
				};
				document.body.innerHTML = document.body.innerHTML.replace(searchRegex, replaceAndCount);
			}

			// processing iframes
			const iframes = document.querySelectorAll('iframe');
			for (const iframe of iframes) {
				result[search] = utils.doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color);
			}
		}
	}
	else {
		// No matter webpage or textInputFields, we highlight the text in the current document body
		// Replace words in the current document body by checking each DOM Element Node
		utils.highlightWithCanvas(result, document.body, activeItems, searchConfig);
	}

	return result;
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
	// console.log('doSearchAndHighlight is called.');
	observer?.disconnect();  // Temporarily disconnect the observer to avoid infinite loop

	// INFO: Remove the existing highlighting canvas if it exists, to redraw the highlights freshly
	// The use case is if DOM is updated, we redraw new findings correctly
	for (const c of document.body.getElementsByClassName('xword-highlight-canvas')) {
		c.remove();
	}

	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

	const result = searchAndHighlight(activeItems, searchConfig);

	startObserving(observer);

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
	return utils.throttle((observer?: MutationObserver) => {
		const now = Date.now();
		// Add current timestamp
		callTimestamps.push(now);

		doSearchAndHighlight(observer);
	}, milliseconds);
}
let throttledSearchReplace = setupThrottledHighlight(throttleLimit);

// Start the periodic check
checkCallFrequency();

const startObserving = (observer?: MutationObserver) => observer?.observe(document.body, {
	attributes: true,	// Monitor attribute changes in Element, i.e., display style, position, etc.
	childList: true,	// Monitor child changes in Element, i.e., adding or removing child nodes
	subtree: true,	// Monitor all descendants of the target node
	characterData: true,	// Monitor text changes in TextNode
});

export async function continuousHighlight() {
	// console.log('Continuous highlighting is enabled.');
	window.addEventListener('load', () => throttledSearchReplace());
	document.addEventListener('DOMContentLoaded', () => throttledSearchReplace());

	// INFO: we don't monitor the network request because DOM observer seems good enough for this use case
	const observer = new MutationObserver(() => {
		// console.log('DOM mutation detected.');
		throttledSearchReplace(observer);
	});
	startObserving(observer);
}