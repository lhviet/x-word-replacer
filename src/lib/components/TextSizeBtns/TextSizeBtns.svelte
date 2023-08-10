<script lang='ts'>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import ZoomOutIcon from '../../icons/106233_zoom_out_icon.svelte';
	import ZoomInIcon from '../../icons/106237_zoom_in_icon.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import TransparentBtn from '$lib/components/TransparentBtn/TransparentBtn.svelte';

	export let value = 0.8;

	function zoomIn() {
		value += 0.1;
		updateFontsize();
	}

	function zoomOut() {
		if (value < 0.5) return;
		value -= 0.1;
		updateFontsize();
	}

	const getRoundedValue = (val) => Math.round(val * 10) / 10;

	$: value = value > getRoundedValue(value) ? getRoundedValue(value) : value;

	function updateFontsize() {
		dispatch('update', { value: getRoundedValue(value) });
	}
</script>

<div class='textsize-btns'>
	<div class='field'>
		<span>{value}</span>
		<input type='number' min='0.5' step='0.1' bind:value={value} on:change={updateFontsize} />
		<div class='line'></div>
	</div>
	<TransparentBtn on:click={zoomOut}>
		<Icon color='#5f5f5f' width='0.9rem' height='0.9rem'>
			<ZoomOutIcon />
		</Icon>
	</TransparentBtn>
	<TransparentBtn on:click={zoomIn}>
		<Icon color='#58a75e' width='1.2rem' height='1.2rem'>
			<ZoomInIcon />
		</Icon>
	</TransparentBtn>
</div>

<style lang='scss'>
  .textsize-btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: .2rem;
  }

  .field {
    position: relative;
		width: min-content;
    margin-right: 5px;

    &:has(input:focus) {
      margin-right: 0;
    }

		span {
			visibility: hidden;
			white-space: pre;
      font-size: 1.3em;

      &:has(+ input:focus) {
        padding-right: 5px;
      }
		}

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }

    input {
      background: 0;
      border: 0;
      outline: none;
      width: 100%;
      font-size: 1.3em;
      transition: padding 0.1s 0.1s ease;
			position: absolute;
			left: 0;
      color: #808080;

      &:focus {
        // padding-bottom: 2px;
      }

      &:focus + .line {
        background: #1abc9c;

        &:after {
          transform: scaleX(1);
        }
      }
    }

    .line {
      width: 100%;
      height: 1.5px;
      position: absolute;
      bottom: -2px;
      background: #bdc3c7;

      &:after {
        content: " ";
        position: absolute;
        float: right;
        width: 100%;

        transform: scalex(0);
        transition: transform 0.2s ease;
      }
    }
  }
</style>