import { type Writable, writable } from "svelte/store";
import { colorPalettes } from "$lib/colors";
import { continuousHighlight, stopObserving } from '../content-scripts/replacer';

export interface AppState {
  loading: boolean;
  isPanelOpen: boolean;
}

export interface LocalAppState {
  floatingBtn: boolean;
}

export interface SearchReplace {
  active: boolean;
  search: string;
  replace: string;
  backgroundColor?: string;
  textColor?: string;
  count?: number;
}

export interface SearchConfig {
  matchCase: boolean;
  regex: boolean;
  textInputFields: boolean;
  webpage: boolean;
  html: boolean;

  // to highlight all occurrences of the search term automatically
  autoHighlight: boolean;
}

export interface SearchResult {
  [key: string]: HighlightResult;
}
export interface HighlightResult {
  matches: Set<string>;
  total: number;
}

// --------- SVELTE STORAGE ----------

export const appState: Writable<AppState> = writable({
  loading: false,
  isPanelOpen: false,
});

export const localAppState: Writable<LocalAppState> = writable({
  floatingBtn: true,
});

export const searchReplaceState: Writable<SearchReplace[]> = writable([
  {
    active: true,
    search: '',
    replace: '',
    backgroundColor: '',
    textColor: '',
    count: 0,
  }
]);
export const searchConfigState: Writable<SearchConfig> = writable({
  matchCase: false,
  regex: false,
  textInputFields: true,
  webpage: true,
  html: false,
  autoHighlight: true,
});

// --------- CHROME STORAGE ----------
export async function initStorage() {
  let { localAppConfig } = await chrome.storage.local.get(['localAppConfig']);
  if (localAppConfig?.floatingBtn === undefined) {
    localAppConfig = {
      floatingBtn: true,
    };
  }
  localAppState.set(localAppConfig);

  let { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

  if (!searchReplace) searchReplace = [];
	if (!searchConfig) {
    searchConfig = {
      matchCase: false,
      regex: false,
      // to search and replace in text input and textarea fields
      textInputFields: true,
      // to search and replace in the whole webpage content
      webpage: true,
      // to search and replace in the whole webpage including HTML tags
      html: false,
      // to highlight all occurrences of the search term automatically
      autoHighlight: true,
    };
  } else {
    if (searchConfig.webpage === undefined) searchConfig.webpage = true;
    if (searchConfig.textInputFields === undefined) searchConfig.textInputFields = true;
  }

  if (searchReplace.length === 0) {
    searchReplace.push({
      active: true,
      search: '',
      replace: '',
      backgroundColor: colorPalettes[0][0],
      textColor: colorPalettes[0][1],
      count: 0,
    });
  } else {
    // If there is no color in the searchReplace, set the default color
    for (let i = 0; i < searchReplace.length; i++) {
      if (!searchReplace[i].backgroundColor || !searchReplace[i].textColor) {
        const color = colorPalettes[i % colorPalettes.length];
        searchReplace[i].backgroundColor = color[0];
        searchReplace[i].textColor = color[1];
      }
    }
  }

  // Store the whole data of editor and note metadata to the Svelte store, assume that they are small enough to be stored in memory
  searchReplaceState.set(searchReplace);
  searchConfigState.set(searchConfig);

  // After loading the data, start auto-saving for any changes from now on
  startAutoSaving();
}

initStorage();

// --------- SVELTE CHROME STORAGE SYNCHRONIZATION ----------
export interface LocalStore {
  localAppConfig: LocalAppState;
}

export interface SyncStore {
  searchReplace: SearchReplace[];
  searchConfig: SearchConfig;
}

function startAutoSaving() {
  localAppState.subscribe(async (localAppConfig) => {
    await chrome.storage.local.set({ localAppConfig });
  });

  searchConfigState.subscribe(async (searchConfig) => {
    await chrome.storage.sync.set({ searchConfig });

    if (searchConfig.autoHighlight) {
      continuousHighlight();
    } else {
      stopObserving();
    }
  })

  // Auto remove item that has empty fields in search and replace
  searchReplaceState.subscribe(async (searchReplace) => {
    removeEmtpyFields(searchReplace);
  })
}

async function removeEmtpyFields(searchReplace: SearchReplace[]) {
  const filteredSearchReplace = searchReplace.filter((item) => item.search !== '' || item.replace !== '');
  await chrome.storage.sync.set({ searchReplace: filteredSearchReplace });
}
