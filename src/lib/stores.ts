import {
  Writable,
  writable
} from "svelte/store";

export interface AppState {
  savingDocMeta: boolean;
  savingDocContent: boolean;
  openSideMenu: boolean;
}

export type LanguageOption = 'text' | 'markdown' | 'json' | 'javascript' | 'typescript' | 'css' | 'html' | 'sql' | 'python' | 'java';
export interface Editor {
  tabSize: number;
  fontSize: number;
  basic: boolean;
  lineWrapping: boolean;
  editable: boolean,
  readonly: boolean,
  placeholder: string,
  language: LanguageOption;
  theme?: 'dark';
}
const defaultEditor: Editor = {
  tabSize: 2,
  fontSize: 0.8,
  basic: true,
  lineWrapping: true,
  editable: true,
  readonly: false,
  placeholder: 'Click here to start writing something...📝',
  language: 'markdown',
  theme: undefined,
}

export interface NoteMetadata {
  title: string;  // title of the note, could be duplicated
  isTitleFixed?: boolean; // if the title is fixed, it won't be generated automatically based on its content
  code_language: string; // language of the note, e.g., markdown, javascript, etc., to reload the note with the correct language
  created: number;
  updated: number;
  lastOpened: number;
  expanded: boolean;  // if path is a directory, it could be expanded or collapsed

  // TODO: when deleting a note, remember to update the path of its NoteContent
  deletedAt?: number; // if the note is deleted, we don't remove it from the storage, but mark it as deleted
  deletedFrom?: string; // keep track of the path where the note is deleted from
}
export interface Note {
  // Given that we are not processing a massive data, because end-users will manage directories and files by themselves on their local
  // the note is stored in a tree structure, we use the path to identify a note.
  // If we try to store and process notes of all users in our server, we should figure out a better way to manage and process them efficiently
  [path: string] : NoteMetadata; // path of the note, unique. If it's a directory, it ends with '/'. If it's a file, it starts with 'f-{timestamp}'.
}

export interface NoteContent {
  // The Note metadata and its content are stored separately for performance reasons, i.e., when loading the list of notes, we don't need to load the content of each note.
  [path: string]: string; // content of a note
}

// --------- CHROME STORAGE ----------
export function findLastOpened(noteMetadata: Note) {
  let maxTimestamp = -Infinity;
  let lastOpenedObj = null;

  for (const key in noteMetadata) {
    if (noteMetadata[key].lastOpened > maxTimestamp) {
      maxTimestamp = noteMetadata[key].lastOpened;
      lastOpenedObj = key;
    }
  }

  return lastOpenedObj;
}


let port: chrome.runtime.Port;
// Asynchronously retrieve data from storage.sync
const initStorage = async (
  writableEditor: Writable<Editor>,
  writableNote: Writable<Note>,
  writableNoteContent: Writable<NoteContent>,
) => {
  const { editor, note, noteContent } = await chrome.storage.sync.get(['editor', 'note', 'noteContent']);

  // Store the whole data of editor and note metadata to the Svelte store, assume that they are small enough to be stored in memory
  if (editor) writableEditor.set(editor);
  if (note) writableNote.set(note);

  // However, for noteContent, the data could be large, so we only store the last opened or cached note to the Svelte store
  const lastOpen = findLastOpened(note);
  const cachedContent: NoteContent = {};
  if (lastOpen && noteContent && noteContent[lastOpen]) {
    cachedContent[lastOpen] = noteContent[lastOpen];
  }
  writableNoteContent.set(cachedContent);

  // After loading the data, start auto-saving for any changes from now on
  startAutoSaving();

  // Connect to the background script to notify the app when the sidePanel is opened or closed
  port = chrome.runtime.connect({name: "sidePanelPort"});
}

export const cleanDocs = async () => {
  port.postMessage({ action: "CleanDocs" });
}

// --------- SVELTE STORAGE ----------

export const appState: Writable<AppState> = writable({
  savingDocMeta: false,
  savingDocContent: false,
  openSideMenu: false,
});
export const editorOption: Writable<Editor> = writable(defaultEditor);
export const note: Writable<Note> = writable({});
export const noteContent: Writable<NoteContent> = writable({});

initStorage(editorOption, note, noteContent);

// --------- SVELTE CHROME STORAGE SYNCHRONIZATION ----------
export interface SyncStore {
  editor: Editor;
  note: Note;
  noteContent: NoteContent;
}

function startAutoSaving() {
  editorOption.subscribe(async (editor) => {
    await chrome.storage.sync.set({ editor });
  })

  note.subscribe(async (note) => {
    // Auto save metadata of the note
    await chrome.storage.sync.set({ note });

    // Notify app that save completed
    setTimeout(() => {
      appState.update(state => ({ ...state, savingDocMeta: false }));
    }, 500);
  })

  noteContent.subscribe(async (content) => {
    // Auto save cached contents of notes
    let { noteContent } = await chrome.storage.sync.get("noteContent");
    if (!noteContent) noteContent = {};

    for (const path in content) {
      noteContent[path] = content[path];
    }
    await chrome.storage.sync.set({ noteContent });

    // Notify app that save completed
    setTimeout(() => {
      appState.update(state => ({ ...state, savingDocContent: false }));
    }, 500);
  })
}

export async function loadNoteContent(paths: string[]) {
  const data = await chrome.storage.sync.get("noteContent");
  const cachedContent: NoteContent = {};
  for (const path of paths) {
    cachedContent[path] = data.noteContent[path];
  }
  noteContent.update(state => ({ ...state, ...cachedContent }));
}

export async function deleteNote(paths: string[]) {
  // TODO: set DeletedAt timestamp and move to a trash folder (/trash/f-...). Delete permanently after 30 days.
  let { note: sNote, noteContent: sContent } = await chrome.storage.sync.get(['note', 'noteContent']);
  if (!sNote) sNote = {};
  if (!sContent) sContent = {};
  for (const path of paths) {
    delete sNote[path];
    delete sContent[path];
  }
  await chrome.storage.sync.set({ note: sNote, noteContent: sContent });

  note.update((state: Note) => sNote);
  noteContent.update((state: NoteContent) => {
    const newState = { ...state };
    for (const path of paths) {
      delete newState[path];
    }
    return newState;
  });
}
