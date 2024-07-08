<script lang="ts">
	import { slide } from 'svelte/transition';

	import { colorPalettes } from '$lib/colors';
	import { appState, searchConfigState, searchReplaceState } from '$lib/stores';

	import TransparentBtn from '$lib/components/TransparentBtn';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import { SquarePlus, SquareX } from 'lucide-svelte';

	// Add new fields of Search & handleReplace
	function addNewField() {
		searchReplaceState.update((state) => {
			const color = colorPalettes[state.length % colorPalettes.length];

			return [
				{
					active: true,
					search: '',
					replace: '',
					backgroundColor: color[0],
					textColor: color[1],
					result: {}
				},
				...state
			];
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

	const onClickSearchAndHighlight = async () => {
		appState.update((state) => {
			state.loading = true;
			return state;
		});

		const result = await chrome.runtime.sendMessage('searchAndHighlight');
		searchReplaceState.update((state) => {
			for (const field of state) {
				field.result = result[field.search];
			}
			state.sort((a, b) => b.active - a.active);
			return state;
		});

		appState.update((state) => {
			state.loading = false;
			return state;
		});
	};

	function loseSearchFocus() {
		if ($searchConfigState.autoHighlight) {
			onClickSearchAndHighlight();
		}
	}

	let expandedStates = {};

	function toggleExpand(index) {
		expandedStates[index] = !expandedStates[index];
	}
</script>

<div class="p-2 pb-1 flex justify-between items-center border-b border-gray-200">
	<div class="flex items-center space-x-4">
		<div class="flex items-center space-x-2">
			<Switch
				class="h-5 align-middle data-[state=checked]:bg-slate-400"
				bind:checked={$searchConfigState.autoHighlight}
			/>
			<span class="text-slate-800">Auto</span>
		</div>
		<button
			class="bg-yellow-300 hover:bg-yellow-400 border border-slate-400 text-primary px-3 py-1 h-8 rounded"
			on:click={onClickSearchAndHighlight}
		>
			Highlight
		</button>
	</div>
	<button on:click={addNewField} class="p-1 text-blue-800 hover:text-green-900">
		<SquarePlus class="h-6 w-6" />
	</button>
</div>

{#each $searchReplaceState as field, i}
	<div class="flex items-center p-1 gap-1">
		<!-- First column (55% of row width) -->
		<div class="flex items-center w-[55%] space-x-2">
			<div class="w-2 text-xs">{i + 1}</div>
			<div class="flex items-center">
				<input type='checkbox' class="w-4 h-4" bind:checked={field.active} />
			</div>
			<div class="relative flex-grow">
				<Input
					bind:value={field.search}
					on:focusout={loseSearchFocus}
					placeholder="Search"
					class="w-full p-1 h-auto"
					style='background-color: {field.backgroundColor}; color: {field.textColor}'
				/>
				<TransparentBtn
					class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-destructive"
					on:click={() => clearSearch(i)}
				>
					x
				</TransparentBtn>
			</div>
			{#if field.result?.total}
				<Button class="h-6 px-2" on:click={() => toggleExpand(i)}>
					{field.result.total}
				</Button>
			{/if}
		</div>

		<!-- Second column (45% of row width) -->
		<div class="flex items-center w-[45%] space-x-2">
			<div class="relative flex-grow">
				<Input
					bind:value={field.replace}
					placeholder="Replace by"
					class="w-full p-1 h-auto bg-secondary"
				/>
				<TransparentBtn
					class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-destructive"
					on:click={() => clearReplace(i)}
				>
					x
				</TransparentBtn>
			</div>
			<TransparentBtn
				class="flex-shrink-0"
				on:click={() => removeSearchField(i)}
			>
				<SquareX class="h-5 w-5 text-gray-500" />
			</TransparentBtn>
		</div>
	</div>

	{#if field.result?.total && expandedStates[i]}
		<div transition:slide="{{ duration: 300 }}" class="my-1 mx-8 flex gap-2 flex-wrap">
			{#each field.result.matches as match}
				<Badge>{match}</Badge>
			{/each}
		</div>
	{/if}
{/each}