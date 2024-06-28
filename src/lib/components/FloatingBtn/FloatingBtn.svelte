<!-- FloatingButton.svelte -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';

	export let icon = null;

	let button;
	let isDragging = false;
	let currentX;
	let currentY;
	let initialX;
	let initialY;
	let xOffset = 0;
	let yOffset = 0;

	const dispatch = createEventDispatcher();

	onMount(() => {
		button.addEventListener('mousedown', dragStart);
		window.addEventListener('mousemove', drag);
		window.addEventListener('mouseup', dragEnd);

		return () => {
			window.removeEventListener('mousemove', drag);
			window.removeEventListener('mouseup', dragEnd);
		};
	});

	function dragStart(e) {
		initialX = e.clientX - xOffset;
		initialY = e.clientY - yOffset;

		if (e.target === button) {
			isDragging = true;
		}
	}

	function drag(e) {
		if (isDragging) {
			e.preventDefault();
			currentX = e.clientX - initialX;
			currentY = e.clientY - initialY;

			xOffset = currentX;
			yOffset = currentY;

			setTranslate(currentX, currentY, button);
		}
	}

	function dragEnd(e) {
		initialX = currentX;
		initialY = currentY;

		isDragging = false;
	}

	function setTranslate(xPos, yPos, el) {
		el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
	}

	function handleClick(event) {
		if (!isDragging) {
			dispatch('click', event);
		}
	}
</script>

<button bind:this={button} on:click={handleClick} on:mousedown|preventDefault>
	{#if icon}
		<svelte:component this={icon} />
	{:else}
		Floating Button
	{/if}
</button>

<style>
    button {
        z-index: 9999;
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px;
        background-color: rgba(0, 123, 255, 0.8);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        transition: box-shadow 0.2s ease, background-color 0.2s ease;
    }

    button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 12px rgba(0, 0, 255, 0.2);
        background-color: rgba(0, 123, 255, 1);
    }

    button :global(svg) {
        pointer-events: none;
        transition: all 0.2s ease;
        transform: rotate(-10deg);
    }

    button:hover :global(svg) {
        transform: rotate(10deg);
    }
</style>