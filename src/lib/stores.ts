import { type Writable, writable } from "svelte/store";
import { browser } from '$app/environment';
import { colorPalettes } from "./colors";

export interface AppState {
  loading: boolean;
}

export interface SearchReplace {
  active: boolean;
  search: string;
  replace: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface SearchConfig {
  matchCase: boolean;
  regex: boolean;
  textInputFields: boolean;
  webpage: boolean;
}

// --------- SVELTE STORAGE ----------

export const appState: Writable<AppState> = writable({
  loading: false,
});
export const searchReplaceState: Writable<SearchReplace[]> = writable([
  {
    active: true,
    search: '',
    replace: '',
    backgroundColor: '',
    textColor: '',
  }
]);
export const searchConfigState: Writable<SearchConfig> = writable({
  matchCase: false,
  regex: false,
  textInputFields: false,
  webpage: true,
});

// --------- CHROME STORAGE ----------
if (browser) {
  initStorage();
}
export async function initStorage() {
  let { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

  if (!searchReplace) searchReplace = [];
	if (!searchConfig) searchConfig = {
		matchCase: false,
		regex: false,

    // to search and replace in text input and textarea fields
		textInputFields: false,

    // to search and replace in the whole webpage
		webpage: true,
	};

  if (searchReplace.length === 0) {
    searchReplace.push({
      active: true,
      search: '',
      replace: '',
      backgroundColor: colorPalettes[0][0],
      textColor: colorPalettes[0][1],
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

// --------- SVELTE CHROME STORAGE SYNCHRONIZATION ----------
export interface SyncStore {
  searchReplace: SearchReplace[];
  searchConfig: SearchConfig;
}

function startAutoSaving() {
  searchConfigState.subscribe(async (searchConfig) => {
    await chrome.storage.sync.set({ searchConfig });
  })
  searchReplaceState.subscribe(async (searchReplace) => {
    // Auto remove item that has empty fields in search and replace
    const filteredSearchReplace = searchReplace.filter((item) => item.search !== '' || item.replace !== '');
    await chrome.storage.sync.set({ searchReplace: filteredSearchReplace });
  })
}
