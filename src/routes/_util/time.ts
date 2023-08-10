import type { Note } from '$lib/stores';
import dayjs from 'dayjs';

export const getDatetime = (dayjsTime?: any) => (dayjsTime ?? dayjs()).format('YYYY-MM-DD_HH:mm:ss');

export const sortNoteByLastOpened = (note: Note): string[] => {
	const arr = Object.keys(note).map((path) => ({ path, lastOpened: note[path].lastOpened }));
	arr.sort((a, b) => b.lastOpened - a.lastOpened);
	return arr.map((item) => item.path);
};