<script lang='ts'>
	import { searchConfigState, searchReplaceState } from '$lib/stores';
	import TransparentBtn from '$lib/components/TransparentBtn';
	import UltraNotesBtn from '$lib/components/UltraNotesBtn';

	// Add new fields of Search & handleReplace
	function addNewField() {
		searchReplaceState.update((state) => {
			state.push({
				active: true,
				search: '',
				replace: ''
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
	const onClickSearchAndReplace = () => chrome.runtime.sendMessage('searchAndReplace');
	
</script>

<div class='popup-header'>
	<img src='images/icon_48.png' />

	<UltraNotesBtn />
	<button class='btn' on:click={onClickSearchAndReplace}>Search & Replace</button>
</div>
<div class='popup-body'>
	<table id='tbl_fields'>
		<tr>
			<th></th>
			<th></th>
			<th>Search for</th>
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
					<span class='clearable'>
						<input class='form-control data_field search' bind:value={field.search} />
						<TransparentBtn on:click={() => clearSearch(i)}>x</TransparentBtn>
					</span>
				</td>
				<td>
					<span class='clearable'>
						<input class='form-control data_field replace' bind:value={field.replace} />
						<TransparentBtn on:click={() => clearReplace(i)}>x</TransparentBtn>
					</span>
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
							<input id='idIsInputFieldOnly' type='checkbox' bind:checked={$searchConfigState.inputOnly} />
						</td>
						<td>
							<label for='idIsInputFieldOnly'>Replace in Input/TextArea only</label>
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
		<tr>
			<td colspan='2' style='text-align:center;'>
				<a class='link-youtube' href='http://youtu.be/lcZCdM1Bx_E' target='_blank'>
					<img src='images/Youtube-logo-png.png' height='34' />
				</a>
		</tr>
	</table>
</footer>