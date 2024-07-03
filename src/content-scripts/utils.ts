// Helper function to escape special characters in a string for regex
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
// INFO: this function is used when we want to convert a normal string, that may contain
// special characters, i.e., dot `.`, into a regex string. In that case, to keep the dot as a dot,
// we need to escape it. I.e., `.` -> `\.`
import type { HighlightResult, SearchConfig, SearchReplace, SearchResult } from '$lib/stores';
import { throttle } from '$utils/throttle';

export const RegExEscape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

	return `<xword class="xword-search-n-highlight" style="background-color: ${backgroundColor}; color: ${textColor}">${searchValue}<span class='x-word-count'>${count}</span></xword>`;
}

export function doReplaceInputs(inputs, searchRegex, replace) {
	const highlightResult: HighlightResult = {
		matches: new Set(),
		total: 0,
	};

	const replaceAndCount = (match) => {
		highlightResult.matches.add(match.toString());
		highlightResult.total++;

		return replace;
	}

	for (const input of inputs) {
		try {
			input.value = input.value.replace(searchRegex, replaceAndCount);
		} catch (e) {
			console.warn('Failed in doReplaceInputs:', e);
		}
	}

	return highlightResult;
}

export function doReplaceInIframe(iframe, searchRegex, replace, textInputFields, webpage, color) {
	const highlightResult: HighlightResult = {
		matches: new Set(),
		total: 0,
	};

	const replaceAndCount = (match) => {
		highlightResult.matches.add(match.toString());
		highlightResult.total++;

		return getColorHTMLElement(color, highlightResult.total, match, replace);
	}

	const iframeDocument = iframe.contentDocument?.documentElement;

	if (!iframeDocument) return highlightResult;

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

			const inputResult = doReplaceInputs([
				...inputElems,
				...textAreaElems,
			], searchRegex, replace);

			highlightResult.matches = new Set([...highlightResult.matches, ...inputResult.matches]);
			highlightResult.total += inputResult.total;
		}
	} catch (e) {
		console.warn('Failed in doReplaceInIframe:', e);
	}

	return highlightResult;
}

function getAllMatchesIndexes(regex, str) {
	const matches = [];
	let match;

	while ((match = regex.exec(str)) !== null) {
		matches.push({
			match,
			start: match.index,
			end: match.index + match[0].length
		});

		// Prevent infinite loop for zero-length matches
		if (regex.lastIndex === match.index) {
			regex.lastIndex++;
		}
	}

	return matches;
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
export function replaceTextWithElement(
	highlightResult: HighlightResult,
	elementNode,
	regexSearchValue,
	replaceValue,
	searchTextInputs,
	webpage
) {
	// Iterate through all child nodes of the element and search or replace text with the given regex searchValue
	const shouldProcessInputs = searchTextInputs;

	// INFO: we should use Array.from to convert NodeList to Array to avoid the live NodeList
	// It means that if we update/remove a child from the NodeList, the NodeList will be updated.
	const childrenNodes = Array.from(elementNode.childNodes);

	const customReplaceAndCount = (match) => {
		highlightResult.matches.add(match.toString());
		highlightResult.total++;

		return replaceValue;
	}

	for (let i = 0; i < childrenNodes.length; i++) {
		const child = childrenNodes[i];

		if (child.nodeType === Node.ELEMENT_NODE) {
			const tagName = child.tagName.toLowerCase();

			// Handle input and textarea elements
			if (tagName === 'input' || tagName === 'textarea') {
				if (!shouldProcessInputs) {
					// Do nothing if users want to highlight the text (search), instead of replace it
					continue;
				}
				child.value = child.value.replace(regexSearchValue, customReplaceAndCount);
				// TODO: Handle input and textarea elements with highlight (search results to be shown to users against a regex/search)
			}
			// Update iframe elements
			else if (tagName === 'iframe') {
				try {
					let iframeDoc = child.contentDocument || child.contentWindow.document;
					replaceTextWithElement(highlightResult, iframeDoc.body, regexSearchValue, replaceValue, searchTextInputs, webpage);
				} catch (e) {
					console.warn('Cannot access iframe contents:', e);
				}

			} else if (tagName !== 'canvas') {
				// Recursively call the function on child elements
				replaceTextWithElement(highlightResult, child, regexSearchValue, replaceValue, searchTextInputs, webpage);
			}
		}
		else if (webpage && child.nodeType === Node.TEXT_NODE) {
			const text = child.nodeValue;
			// Replace with plain text
			child.nodeValue = text.replace(regexSearchValue, customReplaceAndCount);
		}
	}
}

export const getSearchRegex = (searchValue, searchConfig: SearchConfig) => {
	const flag = searchConfig.matchCase ? 'g' : 'gi';

	// INFO: if we use regex, we should not escape the regex, because users may want to use regex
	// But if we use normal text, we should escape it to avoid special characters in the text, i.e., dot `.`
	//   and use the escaped text as a regex, i.e., `.` -> `\.`
	const regexStr = searchConfig.regex ? searchValue : RegExEscape(searchValue);
	if (!isValidRegex(regexStr)) {
		return null;
	}

	return new RegExp(regexStr, flag);
}

export const getItemColor = (item: SearchReplace) => ({
	backgroundColor: item.backgroundColor,
	textColor: item.textColor,
});

const HIGHLIGHT_ALPHA = 1;
export function highlightWithCanvas(
	searchResult: SearchResult,
	elementNode: HTMLElement,
	activeItems: SearchReplace[],
	searchConfig: SearchConfig,
) {
	// Iterate through all child nodes of the element and search or replace text with the given regex searchValue
	// if color is provided, it means users want to highlight text, and highlighting doesn't apply to input fields
	// INFO: we should use Array.from to convert NodeList to Array to avoid the live NodeList
	// It means that if we update/remove a child from the NodeList, the NodeList will be updated.
	const childrenNodes = Array.from(elementNode.childNodes);

	const canvasDrawingRects = [];

	for (let i = 0; i < childrenNodes.length; i++) {
		if (childrenNodes[i].nodeType === Node.ELEMENT_NODE) {
			const child = childrenNodes[i] as HTMLElement;
			const tagName = child.tagName.toLowerCase();

			// Handle input and textarea elements
			if (tagName === 'input' || tagName === 'textarea') {
				// Do nothing if users want to highlight the text (search), instead of replace it
				continue;
				// TODO: Handle input and textarea elements with highlight (search results to be shown to users against a regex/search)
			}
			// Update iframe elements
			else if (tagName === 'iframe') {
				const iFrameElement = childrenNodes[i] as HTMLIFrameElement;
				try {
					const iframeDoc = iFrameElement.contentDocument || iFrameElement.contentWindow?.document;
					if (iframeDoc?.body) {
						highlightWithCanvas(searchResult, iframeDoc.body, activeItems, searchConfig);
					}
				} catch (e) {
					console.warn('Cannot access iframe contents:', e);
				}

			} else if (tagName !== 'canvas') {
				// Recursively call the function on child elements
				highlightWithCanvas(searchResult, child, activeItems, searchConfig);
			}
		}
		else if (childrenNodes[i].nodeType === Node.TEXT_NODE) {
			const child = childrenNodes[i] as Text;
			const text = child.nodeValue;

			for (const item of activeItems) {
				const searchRegex = getSearchRegex(item.search, searchConfig);

				// Highlight the matches with canvas solution
				const matches = getAllMatchesIndexes(searchRegex, text);

				if (matches.length > 0) {
					// Calculate the relative position of the text node to the container and store the rectangle for drawing later
					const containerRect = elementNode.getBoundingClientRect();
					for (const m of matches) {
						const rect = getHighlightRectangle(child, m.start, m.end);
						const relativeX = rect.left - containerRect.left;
						const relativeY = rect.top - containerRect.top;
						canvasDrawingRects.push({
							x: relativeX,
							y: relativeY,
							width: rect.width,
							height: rect.height,
							backgroundColor: item.backgroundColor,
						});

						searchResult[item.search].matches.add(m.match.toString());
					}
				}
				searchResult[item.search].total += matches.length;
			}
		}
	}

	// If drawing highlights
	if (canvasDrawingRects.length > 0) {
		// Clear canvas if it exists
		const canvas = findContainerCanvas(elementNode);
		if (canvas) {
			clearCanvas(canvas);
			/*canvas.addEventListener('mousemove', (e) => {
				const rect = canvas.getBoundingClientRect();
				const mouseX = e.clientX - rect.left;
				const mouseY = e.clientY - rect.top;

				let hover = false;
				clearCanvas(canvas);
				const ctx = canvas.getContext('2d');
				console.log('canvasDrawingRects', canvasDrawingRects);
				canvasDrawingRects.forEach(shape => {
					if (isMouseOverShape(mouseX, mouseY, shape)) {
						hover = true;
						ctx.globalAlpha = 1;
					} else {
						ctx.globalAlpha = 0.5;
					}
					console.log('Drawing shape:', shape);
					ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
				});

				if (!hover) {
					// (re-)Draw highlights on the canvas
					drawHighlightRectOnCanvas(elementNode, canvasDrawingRects, color.backgroundColor, 0.8);
				}
			});*/
		}
		// (re-)Draw highlights on the canvas
		drawHighlightRectOnCanvas(elementNode, canvasDrawingRects, HIGHLIGHT_ALPHA);
	}
}

// Canvas solution
function adjustContainerPositionZIndex(element: HTMLElement) {
	const position = window.getComputedStyle(element).position;
	if (position === 'static') {
		element.style.position = 'relative';
	}

	const zIndex = window.getComputedStyle(element).zIndex;
	if (zIndex === 'auto') {
		element.style.zIndex = '1';
	}
}

function findContainerCanvas(container: HTMLElement) {
	const canvasElems = container.getElementsByClassName('xword-highlight-canvas');
	if (canvasElems.length > 0) {
		return canvasElems[0] as HTMLCanvasElement;
	}

	return null;
}

const clearCanvas = (canvas: HTMLCanvasElement) => {
	// canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

function getOrCreateHighlightCanvas(container: HTMLElement) {
	// INFO: Check if the canvas already exists
	let canvas = findContainerCanvas(container);
	if (!canvas) {
		// Adjust the container's position and z-index
		adjustContainerPositionZIndex(container);

		canvas = document.createElement('canvas');
		canvas.classList.add('xword-highlight-canvas');
		container.appendChild(canvas);
	}

	const containerRect = container.getBoundingClientRect();
	canvas.width = containerRect.width;
	canvas.height = containerRect.height;

	return canvas;
}

export function getHighlightRectangle(textNode: Text, startIndex: number, endIndex: number) {
	const range = document.createRange();
	range.setStart(textNode, startIndex);
	range.setEnd(textNode, endIndex);

	// Get the bounding rectangle of the range
	return range.getBoundingClientRect();
}

const throttledMouseMove = throttle((e, canvas, shapes, backgroundColor, alpha) => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	const ctx = canvas.getContext('2d');
	ctx.globalAlpha = alpha;

	shapes.forEach(shape => {
		if (isMouseOverShape(mouseX, mouseY, shape)) {
			ctx.fillStyle = 'red';
		} else {
			ctx.fillStyle = backgroundColor;
		}
		// ctx.clearRect(shape.x, shape.y, shape.width, shape.height);
		ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
	});

}, 100);

export function drawHighlightRectOnCanvas(
	container: HTMLElement,
	canvasDrawingRects: any[],
	alpha = 0.5,
) {
	// Create a canvas element to draw highlights associating with the parent node
	const canvas = getOrCreateHighlightCanvas(container);
	/*if (container.innerText === 'Displays a button or a component that looks like a button.') {
		console.log(canvas, 'drawHighlightRectOnCanvas', `
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '${backgroundColor}';
		ctx.globalAlpha = ${alpha};
		
		${canvasDrawingRects.map(shape => `ctx.fillRect(${shape.x}, ${shape.y}, ${shape.width}, ${shape.height});`)}
		`.replaceAll('\t', ' ').replaceAll('\n', ' '));
	}*/
	/*container.addEventListener('mousemove', (e) => {
		throttledMouseMove(e, canvas, canvasDrawingRects, backgroundColor, alpha)
	});*/

	// Draw matching highlights on the canvas
	const ctx = canvas.getContext('2d');
	ctx.globalAlpha = alpha;

	for (const shape of canvasDrawingRects) {
		ctx.fillStyle = shape.backgroundColor;
		ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
	}
	/*if (container.innerText === 'Displays a button or a component that looks like a button.') {
		console.log('drawn');
		if (backgroundColor !== '#FCF2C8') ctx.restore();
		else ctx.save();
	}*/
}

// Function to check if the mouse is over a shape
function isMouseOverShape(mouseX, mouseY, shape) {
	return mouseX > shape.x && mouseX < shape.x + shape.width &&
		mouseY > shape.y && mouseY < shape.y + shape.height;
}