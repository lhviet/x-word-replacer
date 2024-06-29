<script>
	import { onMount, createEventDispatcher } from 'svelte';

	export let icon = null;
	export let onClose = null; // New prop for close handler

	let button;
	let isDragging = false;
	let currentX;
	let currentY;
	let initialX;
	let initialY;
	let xOffset = 0;
	let yOffset = 0;
	let startX;
	let startY;
	let showCloseButton = false;

	const dispatch = createEventDispatcher();

	const CLICK_THRESHOLD = 5; // pixels

	onMount(() => {
		button.addEventListener('mousedown', dragStart);
		window.addEventListener('mousemove', drag);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousemove', drag);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});

	function dragStart(e) {
		e.stopPropagation();
		initialX = e.clientX - xOffset;
		initialY = e.clientY - yOffset;
		startX = e.clientX;
		startY = e.clientY;

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

	function handleMouseUp(e) {
		const endX = e.clientX;
		const endY = e.clientY;
		const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

		if (distance < CLICK_THRESHOLD) {
			handleClick(e);
		}
		e.preventDefault();

		initialX = currentX;
		initialY = currentY;
		isDragging = false;
	}

	function setTranslate(xPos, yPos, el) {
		el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
	}

	function handleClick(event) {
		dispatch('click', event);
	}

	function handleClose(event) {
		event.stopPropagation();
		if (onClose) {
			onClose(event);
		} else {
			dispatch('close', event);
		}
	}
</script>

<button
	bind:this={button}
	on:mousedown|preventDefault
	on:mouseenter={() => showCloseButton = true}
	on:mouseleave={() => showCloseButton = false}
>
	{#if icon}
		<svelte:component this={icon} />
	{:else}
		Floating Button
	{/if}
	{#if showCloseButton}
		<span class="close-button" on:click={handleClose}>×</span>
	{/if}
</button>

<style lang="scss">
  $btnBg: rgba(0, 123, 255, 0.7);
  $btnHoverBg: rgba(0, 123, 255, 0.85);

  button {
    z-index: 9999;
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px;
    background-color: $btnBg;
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
    background-color: $btnHoverBg;
  }

  button :global(svg) {
    pointer-events: none;
    transition: all 0.2s ease;
    transform: rotate(-10deg);
  }

  button:hover :global(svg) {
    transform: rotate(10deg);
  }

  .close-button {
    position: absolute;
    bottom: -4px;
    right: -5px;
    background-color: rgba(65, 65, 65, 0.8);
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .close-button:hover {
    background-color: rgba(65, 65, 65, 1);
  }
</style>