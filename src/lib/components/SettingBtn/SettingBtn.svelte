<script lang="ts">
  import CogIcon from '../../icons/4280491_outlined_settings_cog_wheel_icon.svelte'
  import Icon from "$lib/icons/Icon.svelte";
</script>

<button on:click style="background: rgb(52 52 52)">
    <Icon color="white" width="1rem" height="1rem">
        <CogIcon />
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