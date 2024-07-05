<script lang="ts">
	import { appState, localAppState } from '$lib/stores';
	import UltraNotesBtn from '$lib/components/UltraNotesBtn';
	import { Button } from "$lib/components/ui/button";
	import { Switch } from "$lib/components/ui/switch";
	import { Separator } from '$lib/components/ui/separator';

	import Reload from "svelte-radix/Reload.svelte";

	export let onClickSearchAndReplace: () => void;
</script>

<div>
	<div class='p-2 flex justify-between items-center'>
		<div class="flex gap-1 items-center">
			<img src={chrome.runtime.getURL('static/images/icon_128.png')} width="35" height="35" alt="Icon" />
			<Switch class="h-5 align-middle data-[state=checked]:bg-blue-500" bind:checked={$localAppState.floatingBtn} />
		</div>

		{#if $appState.loading}
			<div class="inline-block ml-3">
				<Reload class="mr-2 h-4 w-4 animate-spin" />
			</div>
		{/if}

		<div>
			<div class="inline-block mr-2"><UltraNotesBtn /></div>
			<Button on:click={onClickSearchAndReplace}>Replace</Button>
		</div>
	</div>
	<Separator class="bg-slate-300" />
</div>