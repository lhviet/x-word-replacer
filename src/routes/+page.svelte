<script lang='ts'>
	import { colorPalettes } from '$lib/colors';
	import { appState, searchConfigState, searchReplaceState } from '$lib/stores';
	import TransparentBtn from '$lib/components/TransparentBtn';
	import UltraNotesBtn from '$lib/components/UltraNotesBtn';

	import { Button } from "$lib/components/ui/button";
	import { Switch } from "$lib/components/ui/switch";
	import * as Table from "$lib/components/ui/table";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Input } from "$lib/components/ui/input";
	import { SquarePlus, SquareX } from 'lucide-svelte';


	// Add new fields of Search & handleReplace
	function addNewField() {
		searchReplaceState.update((state) => {
			const color = colorPalettes[state.length % colorPalettes.length];
			state.push({
				active: true,
				search: '',
				replace: '',
				backgroundColor: color[0],
				textColor: color[1],
			});
			state.sort((a, b) => b.active - a.active);
			return state;
		});
	}

	function removeSearchField(index: number) {
		searchReplaceState.update((state) => {
			state.splice(index, 1);
			state.sort((a, b) => b.active - a.active);

			return state;
		});
	}

	function clearSearch(index: number) {
		searchReplaceState.update((state) => {
			state[index].search = '';
			return state;
		});
	}

	function clearReplace(index: number) {
		searchReplaceState.update((state) => {
			state[index].replace = '';
			return state;
		});
	}

	// TODO: improve the below with tabs.sendmessage
	//   https://developer.chrome.com/docs/extensions/reference/api/runtime#method-sendMessage
	// INFO: current/legacy/should be improved:
	// Unfortunately, sending message directly from popup to ContentScript doesn't work
	// So far, we need to send message to the serviceWorker.
	// The serviceWorker, in turn, will message the ContentScript to manipulate the DOM
	const onClickSearchAndReplace = async () => {
		appState.update((state) => {
			state.loading = true;
			return state;
		});
		const result = await chrome.runtime.sendMessage('searchAndReplace');
		searchReplaceState.update((state) => {
			for (const field of state) {
				const resultItem = result[field.search];
				field['count'] = resultItem ?? 0;
			}
			state.sort((a, b) => b.active - a.active);
			return state;
		});
		appState.update((state) => {
			state.loading = false;
			return state;
		});
	}
	const onClickSearchAndHighlight = async () => {
		appState.update((state) => {
			state.loading = true;
			return state;
		});
		const result = await chrome.runtime.sendMessage('searchAndHighlight');
		searchReplaceState.update((state) => {
			for (const field of state) {
				const resultItem = result[field.search];
				field['count'] = resultItem ?? 0;
			}
			state.sort((a, b) => b.active - a.active);
			return state;
		});
		appState.update((state) => {
			state.loading = false;
			return state;
		});
	}

	function loseSearchFocus() {
		if ($searchConfigState.autoHighlight) {
			onClickSearchAndHighlight();
		}
	}

</script>

<div class='popup-header'>
	<img src='images/icon_48.png' />

	{#if $appState.loading}
		<div style='display: inline-block; margin-left: 10px;'>
			Loading...
		</div>
	{/if}

	<div>
		<div class="inline-block mr-2"><UltraNotesBtn /></div>
		<Button on:click={onClickSearchAndReplace}>Replace</Button>
	</div>
</div>
<div class='popup-body'>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[1rem] text-left p-1">#</Table.Head>
				<Table.Head class="w-[1rem] p-1"></Table.Head>
				<Table.Head class="text-slate-800 p-1">
					Search and
					<Switch class="h-auto align-middle data-[state=checked]:bg-slate-400" bind:checked={$searchConfigState.autoHighlight} /> auto
					<Button class="bg-yellow-300 hover:bg-yellow-400 border-slate-600 border-[1px] text-primary px-2 py-1 h-auto ml-1" on:click={onClickSearchAndHighlight}>Highlight</Button>
				</Table.Head>
				<Table.Head class="w-auto p-0"></Table.Head>
				<Table.Head class="p-1">Replace by</Table.Head>
				<Table.Head class="text-right p-0">
					<TransparentBtn on:click={addNewField} class="align-middle">
						<SquarePlus class="h-6 w-6 text-blue-800 hover:text-green-900" />
					</TransparentBtn>
				</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each $searchReplaceState as field, i}
			<Table.Row class="p-2 pl-0">
				<Table.Cell class="text-xs px-1">{i + 1}</Table.Cell>
				<Table.Cell class="text-xs p-0">
					<input type='checkbox' class="align-middle" bind:checked={field.active} />
				</Table.Cell>
				<Table.Cell class="relative px-2 py-1">
					<Input bind:value={field.search} on:focusout={loseSearchFocus} class="p-1 h-auto" style='background-color: {field.backgroundColor}; color: {field.textColor}' />
					<TransparentBtn class="absolute right-3.5 top-2 text-slate-700 hover:text-destructive" on:click={() => clearSearch(i)}>x</TransparentBtn>
				</Table.Cell>
				<Table.Cell class="p-0">
					{#if field.count}
						{field.count}
					{/if}
				</Table.Cell>
				<Table.Cell class="relative px-2 py-1">
					<Input bind:value={field.replace} class="p-1 h-auto bg-secondary" />
					<TransparentBtn class="absolute right-3.5 top-2 text-slate-700 hover:text-destructive" on:click={() => clearReplace(i)}>x</TransparentBtn>
				</Table.Cell>
				<Table.Cell class="text-center p-0">
					<TransparentBtn class="align-middle" on:click={() => removeSearchField(i)}>
						<SquareX class="h-5 w-5 text-gray-500" />
					</TransparentBtn>
				</Table.Cell>
			</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<footer class="relative">
	<table>
		<tbody>
			<tr>
				<td style="width: 190px;">
					<table>
						<tbody>
							<tr>
								<td>
									<input id='idIsMatchCase' type='checkbox' class='mr-2' bind:checked={$searchConfigState.matchCase} />
								</td>
								<td>
									<label for='idIsMatchCase'>Match Case (regex /i)</label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsRegexUsing' type='checkbox' class='mr-2' bind:checked={$searchConfigState.regex} />
								</td>
								<td>
									<label for='idIsRegexUsing'><a target="_blank" href="https://viet.pughtml.com/posts/post-7-x-word-replacer-multi-highlight-with-regex">Use Regular Expression</a></label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsTextInputFields' type='checkbox' class='mr-2' bind:checked={$searchConfigState.textInputFields} />
								</td>
								<td>
									<label for='idIsTextInputFields'>Input/TextArea</label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsWebpage' type='checkbox' class='mr-2' bind:checked={$searchConfigState.webpage} />
								</td>
								<td>
									<label for='idIsWebpage'>Web page</label>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
				<td style='text-align:center;'><h4>Help us to improve this app...</h4>
					<form class='form-donate' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'
								style='display:inline-table;'>
						<input type='hidden' name='cmd' value='_s-xclick' />
						<input type='hidden'
									 name='hosted_button_id'
									 value='XR358N3E9F5MN' />
						<input
							type='image' src='https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif' name='submit'
							alt='PayPal - The safer, easier way to pay online!' />
						<img alt='' border='0'
								 src='https://www.paypalobjects.com/en_US/i/scr/pixel.gif'
								 width='1' height='1' />
					</form>
					<table style="text-align: left">
						<tbody>
							<tr>
								<td>
									<input id='idIsHTML' type='checkbox' class='mr-2' bind:checked={$searchConfigState.html} />
								</td>
								<td>
									<label for='idIsHTML'>Raw HTML <i>(modify html may break your page)</i></label>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</footer>