<script lang='ts'>
	import { colorPalettes } from '$lib/colors';
	import { appState, searchConfigState, searchReplaceState } from '$lib/stores';
	import TransparentBtn from '$lib/components/TransparentBtn';
	import UltraNotesBtn from '$lib/components/UltraNotesBtn';

	import { Button } from "$lib/components/ui/button";

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

</script>

<div class='popup-header'>
	<img src='images/icon_48.png' />

	{#if $appState.loading}
		<div style='display: inline-block; margin-left: 10px;'>
			Loading...
		</div>
	{/if}

	<div>
		<div style='display: inline-block'>
			<UltraNotesBtn />
		</div>
<!--		<button class='btn' on:click={onClickSearchAndReplace}>Replace</button>-->
		<Button on:click={onClickSearchAndReplace}>Replace</Button>
	</div>
</div>
<div class='popup-body'>
	<table id='tbl_fields'>
		<tbody>
			<tr>
				<th></th>
				<th></th>
				<th>
					Search and
					<button class='highlight-btn' on:click={onClickSearchAndHighlight}>Highlight</button>
				</th>
				<th>Replace by</th>
				<th>
					<button class='btn_info' on:click={addNewField}>+</button>
				</th>
			</tr>
			{#each $searchReplaceState as field, i}
				<tr>
					<td>{i + 1}</td>
					<td>
						<input class='selected_check' type='checkbox' bind:checked={field.active} />
					</td>
					<td>
						<div class='clearable'>
							<input bind:value={field.search} class='form-control data_field search' style='background-color: {field.backgroundColor}; color: {field.textColor}' />
							<TransparentBtn on:click={() => clearSearch(i)}>x</TransparentBtn>
						</div>
						{#if field.count}
							<span>{field.count}</span>
						{/if}
					</td>
					<td>
						<div class='clearable'>
							<input class='form-control data_field replace' bind:value={field.replace} />
							<TransparentBtn on:click={() => clearReplace(i)}>x</TransparentBtn>
						</div>
					</td>
					<td class='text-center'>
						<button class='btn_remove' on:click={() => removeSearchField(i)}>x</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<footer>
	<table>
		<tbody>
			<tr>
				<td style="width: 190px;">
					<table>
						<tbody>
							<tr>
								<td>
									<input id='idIsMatchCase' type='checkbox' bind:checked={$searchConfigState.matchCase} />
								</td>
								<td>
									<label for='idIsMatchCase'>Match Case (regex /i)</label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsRegexUsing' type='checkbox' bind:checked={$searchConfigState.regex} />
								</td>
								<td>
									<label for='idIsRegexUsing'><a target="_blank" href="https://viet.pughtml.com/posts/post-7-x-word-replacer-multi-highlight-with-regex">Use Regular Expression</a></label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsTextInputFields' type='checkbox' bind:checked={$searchConfigState.textInputFields} />
								</td>
								<td>
									<label for='idIsTextInputFields'>Input/TextArea</label>
								</td>
							</tr>
							<tr>
								<td>
									<input id='idIsWebpage' type='checkbox' bind:checked={$searchConfigState.webpage} />
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
									<input id='idIsHTML' type='checkbox' bind:checked={$searchConfigState.html} />
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