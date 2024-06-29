<script lang="ts">
	import { appState, type AppState } from '$lib/stores';
	import { fly } from 'svelte/transition';

	export let component: any;
	export let props: any = {};

	function togglePanel() {
		appState.update((state: AppState) => ({ ...state, isPanelOpen: !state.isPanelOpen }));
	}
</script>

<div class="side-panel-container" class:open={$appState.isPanelOpen}>
	<button class="toggle-button" on:click={togglePanel}>
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="15 18 9 12 15 6"></polyline>
		</svg>
	</button>

	{#if $appState.isPanelOpen}
		<div class="side-panel" transition:fly={{ x: 380, duration: 300 }}>
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
        right: -380px;
        width: 380px;
        height: 100vh;
        transition: right 0.2s ease-in-out;
    }

    .side-panel-container.open {
        right: 0;
    }

    .side-panel {
        width: 100%;
        height: 100%;
        background-color: white;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        overflow-y: auto;
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
        left: -13px;
        bottom: 15%;
        background-color: rgb(255 255 255 / 75%);
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
        background-color: #f0f0f0;
    }
</style>