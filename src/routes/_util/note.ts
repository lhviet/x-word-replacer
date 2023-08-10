import dayjs from 'dayjs';
import { getDatetime } from './time';
import { type NoteMetadata } from '$lib/stores';

type NoteInfo = {
	path: string;
	metadata: NoteMetadata;
}
export const newNote = (): NoteInfo => {
	const now = dayjs();

	return {
		path: `/f-${now.unix()}`, // path of the note, unique. If it's a directory, it ends with '/'. If it's a file, it starts with 'f-{timestamp}'.
		metadata: {
			title: getDatetime(now),
			isTitleFixed: false,
			code_language: '',
			created: now.valueOf(),
			updated: now.valueOf(),
			lastOpened: now.valueOf(),
			expanded: false
		}
	};
};

// Generate a valid Filename from a string (note content)
export const getValidFilename = (str: string) => str.split('\n')[0]
	.replace(/\s+/g, ' ')
	.slice(0, 100)
	.replace(/[<>:"/\\|?*]+/g, '')
	.replace(/[\x00-\x1F\x80-\x9F]/g, '')
	.slice(0, 36);