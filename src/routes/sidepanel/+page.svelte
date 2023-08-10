<script lang='ts'>
	import '../../styles.scss';

	// dayjs
	import { getDatetime, sortNoteByLastOpened } from '../_util/time';
	import { newNote, getValidFilename } from '../_util/note';
	import { getEditorLanguage, getEditorTheme } from '../_util/code';

	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime'
	dayjs.extend(relativeTime)

	import CodeMirror from '$lib/CodeMirror';
	import { debounce } from '$lib/CodeMirror/util';
	import ThemeToggleBtn from '../../lib/components/ThemeToggleBtn';
	import SettingBtn from '../../lib/components/SettingBtn';
	import SettingPage from '../../lib/component-with-stores-logic/SettingPage';
	import { appState, editorOption, note, noteContent, findLastOpened, loadNoteContent, deleteNote } from '$lib/stores';
	import LanguageSelector from '$lib/components/LanguageSelector/LanguageSelector.svelte';
	import TextSizeBtns from '$lib/components/TextSizeBtns/TextSizeBtns.svelte';

	// Icons
	import Icon from '$lib/icons/Icon.svelte';
	import TransparentBtn from '$lib/components/TransparentBtn/TransparentBtn.svelte';
	import NewDocIcon from '$lib/icons/7202877_new_plus_doc_pay_card_icon.svelte';
	import SaveIcon from '$lib/icons/9035613_save_outline_floppy_icon.svelte';
	import MenuIcon from '$lib/icons/7124209_menu_icon.svelte';
	import TrashIcon from '$lib/icons/2290850_clean_delete_garbage_recycle bin_trash_icon.svelte';
	import CloseIcon from '$lib/icons/4115230_cancel_close_delete_icon.svelte'

	let currentNote = newNote();
	let currentNoteContent = '';
	let lastOpenedPath = '';

	let notePaths: string[] = [];
	let noteCount = 0;
	let isSideMenuOpened = false;
	let isSettingMenuOpened = false;

	let props: CodeMirror['$$prop_def'] = {
		basic: true,
		editable: true,
		lineWrapping: true,
		readonly: false,
		tabSize: 2,
		placeholder: 'Click here to start writing something...📝',
		language: null,
		theme: null
	};

	function onThemeToggle(): void {
		editorOption.update(option => ({
			...option,
			theme: option.theme ? undefined : 'dark'
		}));
	}

	$: {
		props = {
			basic: $editorOption.basic,
			editable: $editorOption.editable,
			lineWrapping: $editorOption.lineWrapping,
			readonly: $editorOption.readonly,
			tabSize: $editorOption.tabSize,
			placeholder: $editorOption.placeholder,
			language: getEditorLanguage($editorOption.language),
			theme: getEditorTheme($editorOption.theme)
		};
	}

	$: {
		// Auto generate title when the title is empty or not yet manually set by users
		if (!currentNote.metadata.isTitleFixed || currentNote.metadata.title.trim().length < 1) {
			const now = getDatetime();
			let title = now;
			if (currentNoteContent && currentNoteContent.trim().length > 0) {
				title = getValidFilename(currentNoteContent);
				title = title.trim().length > 0 ? title : now;
			}
			currentNote.metadata.title = title;
		}
	}

	// auto saving document in every 5s after the last change
	const debouncedSave = debounce(saveDoc, 2000);
	$: currentNoteContent || currentNote, debouncedSave();
	$: notePaths = sortNoteByLastOpened($note);
	$: noteCount = notePaths.length;

	$: {
		const path = findLastOpened($note);
		if (!lastOpenedPath && path) {
			lastOpenedPath = path;
			currentNote = {
				path: path,
				metadata: $note[path],
			};
			currentNoteContent = $noteContent[path];
		}
	}

	function updateFontsize(event): void {
		editorOption.update(option => ({
			...option,
			fontSize: event.detail.value
		}));
	}

	function updateLanguage(event) {
		editorOption.update(option => ({
			...option,
			language: event.detail.value,
		}));
	}

	function createANewDoc() {
		saveDoc();
		currentNote = newNote();
		currentNoteContent = '';
	}

	function saveDoc() {
		appState.update(state => ({
			...state,
			savingDocMeta: true,
			savingDocContent: true,
		}));

		const { path, metadata } = currentNote;
		const timestamp = dayjs().valueOf();

		// Save metadata of the file
		note.update(note => ({
			...note,
			[path]: {
				...metadata,
				updated: timestamp,
				// lastOpened: timestamp,
				code_language: $editorOption.language,
			}
		}));

		// Save content of the file
		noteContent.update(note => ({
			...note,
			[path]: currentNoteContent
		}));

		lastOpenedPath = path;
	}

	function onTitleKeydown(): void {
		currentNote.metadata.isTitleFixed = true;
	}

	function onClickMenu() {
		isSideMenuOpened = !isSideMenuOpened;
	}

	function onClickOverlay() {
		isSideMenuOpened = !isSideMenuOpened;
	}

	async function onClickNote(path: string) {
		// TODO: open the note
		// Do not update the currentNote because of changing the currentNoteContent
		// get cached noteContent
		saveDoc();
		if (!$noteContent[path]) {
			await loadNoteContent([path]);
		}
		note.update(note => ({
			...note,
			[path]: {
				...note[path],
				lastOpened: dayjs().valueOf(),
			}
		}));
		lastOpenedPath = '';
		// currentNoteContent = $noteContent[path];
	}

	async function onClickDelete(event, path) {
		event.stopPropagation();
		event.preventDefault();
		await deleteNote([path]);
		lastOpenedPath = '';
	}
</script>

<div class="sidenav" class:active={isSideMenuOpened}>
	<div class='sidenav-header'>
		<span>{noteCount} item{noteCount > 0 ? 's' : ''}</span>
		<TransparentBtn class='closeBtn' on:click={onClickMenu}>
			<Icon width='0.9rem' height='0.9rem'><CloseIcon/></Icon>
		</TransparentBtn>
	</div>
	<ul class="sidenav-list" class:active={isSideMenuOpened}>
	{#each notePaths as path, index}
		<li class="list-item" class:active={path === lastOpenedPath} on:click={() => onClickNote(path)}>
			<div class="title-row">
				<span>{$note[path].title}</span>
				<span class='order'>{index + 1}</span>
			</div>
			<div class="info-row">
				<div class="datetime">{dayjs($note[path].lastOpened).fromNow()}</div>
				<TransparentBtn class='trashBtn' on:click={(event) => onClickDelete(event, path)}>
					<Icon><TrashIcon/></Icon>
				</TransparentBtn>
			</div>
		</li>
	{/each}
	</ul>
</div>

<div class="sidenav-content" class:active={isSideMenuOpened}>
	<section class='content-layout'>
		<header class='header'>
			<TransparentBtn on:click={onClickMenu}>
				<Icon color='#b8b8b8' width='1.3rem' height='1.3rem'>
					<MenuIcon />
				</Icon>
			</TransparentBtn>
			<input class='title' bind:value={currentNote.metadata.title} on:keydown={onTitleKeydown} />
			<div class='header-controls'>
				{#if $appState.savingDocMeta || $appState.savingDocContent}
					<span class="loader"></span>
				{:else}
					<TransparentBtn on:click={saveDoc}>
						<Icon color='#afafaf' width='1rem' height='1rem'>
							<SaveIcon />
						</Icon>
					</TransparentBtn>
				{/if}
				<TransparentBtn on:click={createANewDoc}>
					<Icon color='#ffc582' width='1.3rem' height='1.3rem'>
						<NewDocIcon />
					</Icon>
				</TransparentBtn>
			</div>
		</header>

		<main>
			<div class='demo' style='font-size: {$editorOption.fontSize + "rem"}; overflow-x: auto;'>
				<CodeMirror bind:value={currentNoteContent} class='editor' {...props} styles={{
					"&": {
							minHeight: "calc(100vh - 66px)",
							maxHeight: "calc(100vh - 66px)",
					},
				}} />
			</div>
		</main>

		<menu class='footer'>
			<div style='gap:0.7rem'>
				<LanguageSelector bind:value={$editorOption.language} on:update={updateLanguage} />
				<TextSizeBtns bind:value={$editorOption.fontSize} on:update={updateFontsize} />
			</div>
			<div>
				<ThemeToggleBtn bind:theme={$editorOption.theme} on:click={onThemeToggle} />
				<SettingBtn on:click={() => isSettingMenuOpened = !isSettingMenuOpened} />
			</div>
		</menu>

		{#if isSettingMenuOpened}
			<div style='position: absolute; bottom: 35px; right: 0;'>
				<SettingPage tabSize={$editorOption.tabSize} lineWrapping={$editorOption.lineWrapping} on:click={() => isSettingMenuOpened = false} />
			</div>
		{/if}
	</section>
</div>

<div class="overlay" class:active={isSideMenuOpened} on:click={onClickOverlay}></div>

<style lang='scss'>
  .sidenav {
    height: 100%;
    width: 0;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    overflow-x: hidden;
    transition: 0.2s;
    background-color: #f5f5f5;

    &.active {
      width: 250px;
      border-right: solid 1px #b6b6b6;
    }

		.sidenav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 1.6rem;
      padding: 0 0.4rem;
      border-bottom: solid 1px #c7c7c7;
      background-color: #e4e4e4;

			span {
        font-size: 0.8rem;
        border: solid 1px #afafaf;
        padding: 2px 5px;
        background: #ffca69;
        border-radius: 5px;
			}

      :global(.closeBtn) {
        color: #494949;
      }
		}

		.sidenav-list {
      .list-item {
        list-style-type: none;
        cursor: pointer;
        padding: 0.5rem 0.3rem 0.5rem;
        font-size: 0.9rem;
        border-bottom: solid 1px #c7c7c7;
        font-weight: 400;

        &:hover {
          background-color: #181a1f;
          color: white;
          opacity: 0.6;

          :global(.info-row .trashBtn) {
            color: white;
          }
        }

        &.active {
          font-weight: bold;
        }

        .title-row {
          display: flex;
          justify-content: space-between;

          .order {
            font-size: 0.7rem;
            font-style: italic;
            opacity: 0.6;
            font-weight: 400;
          }
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.2rem;

          .datetime {
            font-size: 0.7rem;
            color: #888;
          }
        }
      }
		}
  }

  .sidenav-content {
    transition: margin-left .2s;

    &.active {
      margin-left: 250px;
    }
  }

  .overlay {
    position: fixed;
    display: none;
		top: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.4);
    z-index: 0;
    cursor: pointer;

    &.active {
      display: block;
    }

    @media screen and (min-width: 640px) {
			// don't need to display the overlay to close the Sidebar Menu if the screen is big enough
      &.active {
        display: none;
      }
    }
  }

  .content-layout {
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 32px auto 1fr;
    grid-template-areas:
            "header header"
            "main main"
            "menu menu";

    @media screen and (min-width: 640px) {
      // don't need to display the overlay to close the Sidebar Menu if the screen is big enough
      display: block;
    }
  }

  .header {
    grid-area: header;
    display: grid;
    grid-template-columns: 1.4rem auto 2.5rem;
		justify-content: stretch;
    gap: 0.3rem;
    padding-left: 0;
    padding-right: .2rem;
    height: 32px;
    background: rgba(17, 17, 17, 0.75);

		input {
			text-align: center;
      background: 0;
      border: 0;
      outline: none;
      width: 100%;
      font-size: 1.1em;
      font-weight: 400;
      transition: border 0.1s 0.1s ease;
      color: #e0e0e0;

      &:focus {
        border-bottom: solid 1px #b9ffb9;
      }
		}
  }

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

  main {
    grid-area: main;
  }

  @media screen and (min-width: 640px) {
    .content-layout {
      grid-template-areas:
							"header header"
							"main main"
							"menu menu";
    }

    .header {
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      z-index: 2;
    }
  }

  .demo {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    overflow: hidden;
  }

  :global(.editor) {
    overflow: hidden;
  }

  .footer {
    grid-area: menu;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
    background: #edf2ff;
    border-top: solid 1px #ddd;
    height: 34px;

    > div {
      display: flex;
      justify-content: space-between;
      gap: 0.4rem;
    }
  }

  .loader {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    position: relative;
    animation: rotate 1s linear infinite;

		&:before {
      content: "";
      box-sizing: border-box;
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2.5px solid #FFF;
      animation: prixClipFix 2.5s linear infinite ;
			width: 1rem;
			height: 1rem;
    }
  }

  @keyframes rotate {
    100%   {transform: rotate(360deg)}
  }

  @keyframes prixClipFix {
    0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
    25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
    50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
    75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
    100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
  }

</style>
