<script lang="ts">
  import Sun from '../../icons/7548901_user_interface_sun_sunny_brightness_icon.svelte'
  import Moon from '../../icons/9025835_moon_stars_icon.svelte'
  import Icon from "$lib/icons/Icon.svelte";

  export let theme = '';

  $: color = !theme  ? 'white' : '#f39c12';
</script>

<button on:click style="background: {!theme ? '#fc8230' : 'rgb(52 52 52)'}">
    <Icon bind:color width="1rem" height="1rem">
        <svelte:component this={!theme ? Sun : Moon}/>
    </Icon>
</button>

<style>
    button {
        display: flex;
        border: solid 1px grey;
        padding: 3px;
        border-radius: 4px;
        cursor: pointer;
    }
</style>