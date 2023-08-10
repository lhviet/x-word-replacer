<script lang="ts">
    let className = '';
    export { className as class };
</script>
<button on:click class="{className}">
    <slot />
</button>

<style>
    button {
        background: none;
        border: none;
        cursor: pointer;
        margin: 0;
        padding: 0;
    }
</style>