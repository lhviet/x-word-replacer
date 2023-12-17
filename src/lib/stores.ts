import { type Writable, writable } from "svelte/store";
import { browser } from '$app/environment';

export interface AppState {
  loading: boolean;
}

export interface SearchReplace {
  active: boolean;
  search: string;
  replace: string;
}

export interface SearchConfig {
  matchCase: boolean;
  inputOnly: boolean;
  regex: boolean;
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
  }
]);
export const searchConfigState: Writable<SearchConfig> = writable({
  matchCase: false,
  inputOnly: false,
  regex: false,
});

// --------- CHROME STORAGE ----------
if (browser) {
  initStorage();
}
export async function initStorage() {
  let { searchReplace, searchConfig } = await chrome.storage.sync.get(['searchReplace', 'searchConfig']);

  if (!searchReplace) searchReplace = [];
  if (!searchConfig) searchConfig = { matchCase: false, inputOnly: false, regex: false };

  if (searchReplace.length === 0) {
    searchReplace.push({
      active: true,
      search: '',
      replace: '',
    });
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
