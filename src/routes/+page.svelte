<script lang='ts'>
	import { colorPalettes } from '$lib/colors';
	import { searchConfigState, searchReplaceState } from '$lib/stores';
	import TransparentBtn from '$lib/components/TransparentBtn';
	import UltraNotesBtn from '$lib/components/UltraNotesBtn';

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

			return state;
		});
	}

	function removeSearchField(index: number) {
		searchReplaceState.update((state) => {
			state.splice(index, 1);
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

	// Unfortunately, sending message directly from popup to ContentScript doesn't work
	// So far, we need to send message to the serviceWorker.
	// The serviceWorker, in turn, will message the ContentScript to manipulate the DOM
	const onClickSearchAndReplace = async () => {
		const result = await chrome.runtime.sendMessage('searchAndReplace');
		searchReplaceState.update((state) => {
			for (const field of state) {
				const resultItem = result[field.search];
				field['count'] = resultItem ?? 0;
			}
			return state;
		});
	}
	const onClickSearchAndHighlight = async () => {
		const result = await chrome.runtime.sendMessage('searchAndHighlight');
		searchReplaceState.update((state) => {
			for (const field of state) {
				const resultItem = result[field.search];
				field['count'] = resultItem ?? 0;
			}
			return state;
		});
	}

</script>

<div class='popup-header'>
	<img src='images/icon_48.png' />

	<div>
		<div style='display: inline-block'>
			<UltraNotesBtn />
		</div>
		<span style='padding: 0 5px;'></span>
		<button class='btn' on:click={onClickSearchAndReplace}>Replace</button>
	</div>
</div>
<div class='popup-body'>
	<table id='tbl_fields'>
		<tr>
			<th></th>
			<th></th>
			<th>Search and <button class='highlight-btn' on:click={onClickSearchAndHighlight}>Highlight</button></th>
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
						<span class='count'>{field.count}</span>
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
	</table>
</div>
<footer>
	<table>
		<tr>
			<td>
				<table>
					<tr>
						<td>
							<input id='idIsMatchCase' type='checkbox' bind:checked={$searchConfigState.matchCase} />
						</td>
						<td>
							<label for='idIsMatchCase'>Match Case</label>
						</td>
					</tr>
					<tr>
						<td>
							<input id='idIsRegexUsing' type='checkbox' bind:checked={$searchConfigState.regex} />
						</td>
						<td>
							<label for='idIsRegexUsing'>Using Regular Expression</label>
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
			</td>
		</tr>
	</table>
</footer>