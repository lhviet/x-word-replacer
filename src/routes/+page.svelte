<script>
    let url;
    async function getUrl() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
      url = tab.url;
    }
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<button on:click={getUrl}>Get Current URL</button>

{#if url}
    <div>The current URL is: {url}</div>
{/if}