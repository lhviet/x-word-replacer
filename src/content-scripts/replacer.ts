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
	observer?.disconnect();  // Temporarily disconnect the observer to avoid infinite loop

	// INFO: Remove the existing highlighting canvas if it exists, to redraw the highlights freshly
	// The use case is if DOM is updated, we redraw new findings correctly
	for (const c of document.body.getElementsByClassName('xword-highlight-canvas')) {
		c.remove();
	}

	const { activeItems, searchConfig } = await getActiveSearchReplaceItems();

	const searchResult: SearchResult = searchAndHighlight(activeItems, searchConfig);
	// console.log('doSearchAndHighlight result:', result);

	const result = {}
	for (const [key, value] of Object.entries(searchResult)) {
		result[key] = { matches: Array.from(value.matches), total: value.total };
	}

	callTimestamps.push(Date.now());

	// INFO: somehow if we call startObserving in this function, it will create an infinite loop
	setTimeout(startObserving, 200);

	return result;
}

// Continuous highlighting ------------------------------

// INFO: Initial Throttle Limit: Start with a throttle limit of LOW_THROTTLE_MILLISECONDS.
// Periodic Check: Every CHECK_FREQUENCY_MILLISECONDS, check if the function has been called more than CALL_LIMIT times.
// Increase Throttle:
// 		If the function is called more than CALL_LIMIT times in CHECK_FREQUENCY_MILLISECONDS,
// 		increase the throttle limit to HIGH_THROTTLE_MILLISECONDS.
// Reset Throttle:
// 		After RESET_THRESHOLD_MILLISECONDS from increasing the throttle limit,
// 		reset it back to LOW_THROTTLE_MILLISECONDS and continue the checking process.
const LOW_THROTTLE_MILLISECONDS = 600;
const HIGH_THROTTLE_MILLISECONDS = 3000;
const CHECK_FREQUENCY_MILLISECONDS = 3000;
const RESET_THRESHOLD_MILLISECONDS = 15000;
const CALL_LIMIT = 3;

// Variables
let callTimestamps = [];
let throttleLimit = LOW_THROTTLE_MILLISECONDS;
let isThrottled = false;
let checkIntervalId;
let resetThrottleTimeout;

let throttledSearchReplace = throttle(doSearchAndHighlight, throttleLimit);

function checkCallFrequency() {
	const now = Date.now();
	// Remove timestamps older than CHECK_FREQUENCY_MILLISECONDS
	callTimestamps = callTimestamps.filter(timestamp => {
		const gap = now - timestamp;
		return gap <= CHECK_FREQUENCY_MILLISECONDS
	});

	// Check if there have been more than CALL_LIMIT calls in the last CHECK_FREQUENCY_MILLISECONDS
	if (callTimestamps.length > CALL_LIMIT && !isThrottled) {
		// Increase the throttle limit
		throttleLimit = HIGH_THROTTLE_MILLISECONDS;
		isThrottled = true;
		updateThrottledFunction();
		// console.log(`Throttle limit increased to ${HIGH_THROTTLE_MILLISECONDS} ms.`);

		// Schedule reset of throttle limit
		clearTimeout(resetThrottleTimeout);
		resetThrottleTimeout = setTimeout(resetThrottle, RESET_THRESHOLD_MILLISECONDS);
	}
}

function resetThrottle() {
	throttleLimit = LOW_THROTTLE_MILLISECONDS;
	isThrottled = false;
	updateThrottledFunction();
	// console.log(`Throttle limit reset to ${LOW_THROTTLE_MILLISECONDS} ms.`);
}

function updateThrottledFunction() {
	throttledSearchReplace = throttle(doSearchAndHighlight, throttleLimit);
}

function startDynamicThrottling() {
	// console.log('Starting dynamic throttling...'); // Debug log
	// Clear any existing interval to avoid duplicates
	if (checkIntervalId) {
		clearInterval(checkIntervalId);
	}
	// Start the periodic check
	checkIntervalId = setInterval(checkCallFrequency, CHECK_FREQUENCY_MILLISECONDS);
}

function stopDynamicThrottling() {
	// console.log('Stopping dynamic throttling...'); // Debug log
	if (checkIntervalId) {
		clearInterval(checkIntervalId);
		checkIntervalId = null;
	}
	clearTimeout(resetThrottleTimeout);
}

// Usage
startDynamicThrottling();

let observer: MutationObserver;
const startObserving = () => {
	// console.log('Starting DOM observer...'); // Debug log
	observer?.observe(document.body, {
		attributes: true,	// Monitor attribute changes in Element, i.e., display style, position, etc.
		childList: true,	// Monitor child changes in Element, i.e., adding or removing child nodes
		subtree: true,	// Monitor all descendants of the target node
		characterData: true,	// Monitor text changes in TextNode
	});
}

const domListener = () => throttledSearchReplace();

export const stopObserving = () => {
	document.removeEventListener('DOMContentLoaded', domListener);
	observer?.disconnect();
	stopDynamicThrottling();
}

export async function continuousHighlight() {
	// console.log('Continuous highlighting is enabled.');
	stopObserving();
	doSearchAndHighlight();
	document.addEventListener('DOMContentLoaded', domListener);

	// INFO: we don't monitor the network request because DOM observer seems good enough for this use case
	observer = new MutationObserver((mutations) => {
		// logMutations(mutations);

		throttledSearchReplace();
	});
	startObserving();
}

function logMutations(mutations: MutationRecord[]) {
	if (mutations.length > 0) {
		console.group('DOM Mutation detected:');
	}
	mutations.forEach(mutation => {
		console.log('Type:', mutation.type);

		switch (mutation.type) {
			case 'attributes':
				console.log('Target:', mutation.target);
				console.log('Attribute name:', mutation.attributeName);
				console.log('Old value:', mutation.oldValue);
				break;
			case 'characterData':
				console.log('Target:', mutation.target);
				console.log('Old value:', mutation.oldValue);
				console.log('New value:', mutation.target.textContent);
				break;
			case 'childList':
				console.log('Target:', mutation.target);
				if (mutation.addedNodes.length > 0) {
					console.log('Added nodes:', mutation.addedNodes);
				}
				if (mutation.removedNodes.length > 0) {
					console.log('Removed nodes:', mutation.removedNodes);
				}
				break;
		}

		console.groupEnd();
	});
}