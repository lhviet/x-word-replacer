<script lang="ts">
	import { appState, type AppState, initAppStore } from '$lib/stores';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	export let component: any;
	export let props: any = {};

	let panelWidth = 380;
	let isResizing = false;
	let startX: number;
	let startWidth: number;

	async function togglePanel() {
		/*if (!$appState.isPanelOpen) {
			await initAppStore();
		}*/
		appState.update((state: AppState) => ({ ...state, isPanelOpen: !state.isPanelOpen }));
	}

	function startResize(event: MouseEvent) {
		isResizing = true;
		startX = event.clientX;
		startWidth = panelWidth;
		event.preventDefault();
	}

	function doResize(event: MouseEvent) {
		if (isResizing) {
			const diff = startX - event.clientX;
			const maxWidth = window.innerWidth - 200;
			panelWidth = Math.max(200, Math.min(maxWidth, startWidth + diff));
		}
	}

	function stopResize() {
		isResizing = false;
	}

	onMount(() => {
		window.addEventListener('mousemove', doResize);
		window.addEventListener('mouseup', stopResize);

		return () => {
			window.removeEventListener('mousemove', doResize);
			window.removeEventListener('mouseup', stopResize);
		};
	});
</script>

<div class="side-panel-container" class:open={$appState.isPanelOpen} style="width: {panelWidth}px; right: {$appState.isPanelOpen ? 0 : -panelWidth}px;">
	<button class="toggle-button" on:click={togglePanel}>
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="15 18 9 12 15 6"></polyline>
		</svg>
	</button>

	{#if $appState.isPanelOpen}
		<div class="side-panel" transition:fly={{ x: panelWidth, duration: 300 }}>
			<div class="resize-handle" on:mousedown={startResize}></div>
			<div class="p-0 panel-content">
				<svelte:component this={component} {...props} />
			</div>
		</div>
	{/if}
</div>

<style>
    .side-panel-container {
        position: fixed;
        z-index: 9998;
        top: 0;
        height: 100vh;
        transition: right 0.2s ease-in-out;
    }

    .side-panel {
        width: 100%;
        height: 100%;
        background-color: white;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        overflow-y: auto;
        position: relative;
    }

    .resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
        background-color: transparent;
				z-index: 1;
    }

    .resize-handle:hover {
        background-color: rgba(0, 0, 0, 0.2);
    }

    .panel-content {
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        background-color: rgba(204, 233, 217, 0.75);
    }

    .toggle-button {
        position: absolute;
        left: -12px;
        bottom: 20%;
        background-color: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease-in-out;
        z-index: 1001;
    }

    .open .toggle-button {
        transform: rotate(180deg);
    }

    .toggle-button:hover {
        background-color: rgba(255, 255, 255, 0.7);
    }
</style>