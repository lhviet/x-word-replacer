/*
* All the code here is executed in the context of the current tab.
* It will read the DOM, search and replace the text, and send the result back to the service worker.
* */

const RegExEscape = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const replaceWords = (inputs, regex, replace) => inputs.forEach(item => item.value = item.value.replace(regex, replace));

function searchAndReplace(search, replace, inputOnly) {
    const iframes = document.querySelectorAll('iframe');

    if (inputOnly) {
        // Replace words in the current document
        const allInputs = document.getElementsByTagName('input');
        replaceWords(allInputs, search, replace);

        const textAreas = document.getElementsByTagName('textarea');
        replaceWords(textAreas, search, replace);

        // Replace words in iframes (input & textarea) if it has
        if (iframes.length > 0) {
            for (let i = 0; i < iframes.length; i++) {
                const theIframe = iframes[i];
                if (theIframe.src.match('^http://' + window.location.host) || !theIframe.src.match('^https?')) {
                    const iframeDocument = theIframe.contentDocument.documentElement;

                    const iframeInputs = iframeDocument.getElementsByTagName('input');
                    replaceWords(iframeInputs, search, replace);

                    const iframeTextAreas = iframeDocument.getElementsByTagName('textarea');
                    replaceWords(iframeTextAreas, search, replace);
                }
            }
        }
    } else {
        const body = document.getElementsByTagName('body')[0];
        body.innerHTML = body.innerHTML.replace(search, replace);

        if (iframes) {
            for (let i = 0; i < iframes.length; i++) {
                const theIframe = iframes[i];
                if (theIframe.src.match('^http://' + window.location.host) || !theIframe.src.match('^https?')) {
                    const content = theIframe.contentDocument.documentElement.innerHTML;
                    theIframe.contentDocument.documentElement.innerHTML = content.replace(search, replace);
                }
            }
            const allElements = document.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
                if (!allElements[i].tagName.match('/HEAD|SCRIPT|BODY|STYLE|IFRAME/')) {
                    if (!allElements[i].innerHTML.match('<iframe([\s\S]*|.*)</iframe>')) {
                        allElements[i].innerHTML = allElements[i].innerHTML.replace(search, replace);
                    }
                }
            }
        }
    }
}

// Listen for messages sent from service worker to the content-script
// The reason for messaging is that only the content-script can manipulate the DOM directly
// But the service worker can't access the DOM. Service worker works with the browser API directly.
chrome.runtime.onMessage.addListener(async (message) => {
	if (message !== 'searchAndReplaceInContentScript')
		return;

	const { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

	// prepare search and replace data
	const { inputOnly, matchCase, regex } = searchConfig;
	const flag = matchCase ? 'g' : 'gi';

	const activeSearchArr = searchReplace.filter(item => item.active && item.search.length > 0);
	const processedSearchArr = activeSearchArr.map(item => ({
		search: !regex ? RegExEscape(item.search) : item.search,
		replace: item.replace,
	}));
	const searchRegexArr = processedSearchArr.map(item => ({
		search: new RegExp(item.search, flag),
		replace: item.replace,
	}));

	// search and replace
	for (const item of searchRegexArr) {
		searchAndReplace(item.search, item.replace, inputOnly);
	}
});
