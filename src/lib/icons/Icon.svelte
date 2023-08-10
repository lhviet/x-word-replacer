<script>
  export let color = '';
  export let width = "1rem";
  export let height = "1rem";
</script>

<span class={$$props.class} style="color: {color}; width: {width}; height: {height}">
    <slot/>
</span>

<style>
  span {
    display: inline-block;
    vertical-align: middle;
  }
</style>