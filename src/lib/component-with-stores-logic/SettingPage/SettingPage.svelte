<script lang='ts'>
	import CloseIcon from '../../icons/4115230_cancel_close_delete_icon.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { editorOption } from '$lib/stores';
	import TransparentBtn from '$lib/components/TransparentBtn/TransparentBtn.svelte';
	import ZoomOutIcon from '$lib/icons/1814110_close_less_minus_icon.svelte';
	import ZoomInIcon from '$lib/icons/1814113_add_more_plus_icon.svelte';

	export let tabSize = 2;
	export let lineWrapping = true;

	function increaseTab() {
		tabSize++;
	}

	function decreaseTab() {
		if (tabSize < 2) return;
		tabSize--;
	}

	// TODO: decouple svelte storage from components
	$: editorOption.update(option => ({
		...option,
		tabSize: tabSize < 1 ? 1 : Math.round(tabSize),
		lineWrapping
	}));
</script>

<div class='setting-page'>
	<div class='setting-header'>
		<h4>Editor Setting</h4>
		<TransparentBtn on:click>
			<Icon color='white' width='1rem' height='1rem'>
				<CloseIcon />
			</Icon>
		</TransparentBtn>
	</div>
	<ul class='setting-list'>
		<li class='setting-item'>
			<span>Tab Size</span>
			<section>
				<div class='field'>
					<span>{tabSize}</span>
					<input type='number' min='1' step='1' bind:value={tabSize} />
					<div class='line'></div>
				</div>
				<TransparentBtn on:click={decreaseTab}>
					<Icon color='#5f5f5f' width='1.4rem' height='1.2rem'>
						<ZoomOutIcon />
					</Icon>
				</TransparentBtn>
				<TransparentBtn on:click={increaseTab}>
					<Icon color='#58a75e' width='1.4rem' height='1.2rem'>
						<ZoomInIcon />
					</Icon>
				</TransparentBtn>
			</section>
		</li>
		<li class='setting-item'>
			<label for='lineWrapping'>Line Wrapping</label>
			<input id='lineWrapping' type='checkbox' bind:checked={lineWrapping} />
		</li>
	</ul>
</div>

<style lang='scss'>
  .setting-page {
    min-width: 100px;
    min-height: 100px;
    background: #eaeaea;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.2);
  }

  .setting-header {
    display: flex;
    justify-content: space-between;
		gap: 1rem;
    align-items: center;
    padding: 8px 10px;
    background: #787878;
    color: white;
  }

  .setting-list {
    .setting-item {
      list-style: none;
      padding: 8px 10px;
      border-bottom: solid 1px grey;
			display: flex;
			justify-content: space-between;
			align-items: center;
      gap: 1rem;

      &:last-child {
        border-bottom: none;
      }

			section {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: .2rem;
      }
    }
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