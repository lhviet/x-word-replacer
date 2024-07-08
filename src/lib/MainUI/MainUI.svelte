<style lang="scss">
    @import '../../styles.scss';

    .popup-body {
        flex: 1;
        overflow-y: auto;
    }
    // Scrollbar Styling
    .popup-body::-webkit-scrollbar {
        width: 8px; /* Adjust width of scrollbar */
        background-color: rgba(204, 233, 217, 0.75);
    }

    /* Set the thumb (the draggable part) color */
    .popup-body::-webkit-scrollbar-thumb {
        background-color: #808080; /* Adjust to your desired thumb color */
        border-radius: 3px; /* optional: add border radius for rounded thumb */
    }

    /* Set the track (the non-draggable part) color */
    .popup-body::-webkit-scrollbar-track {
        background-color: rgba(204, 233, 217, 0.75);
    }
</style>

<script lang='ts'>
    // import '../../styles.scss';

    import { appState, searchReplaceState } from '$lib/stores';

    import Footer from '$lib/components/Footer';
    import Header from '$lib/components/Header';
    import SearchReplaceFields from '$lib/components/SearchReplaceFields';

    const onClickSearchAndReplace = async () => {
        appState.update((state) => {
            state.loading = true;
            return state;
        });

        const result = await chrome.runtime.sendMessage('searchAndReplace');
        searchReplaceState.update((state) => {
            for (const field of state) {
                field.result = result[field.search];
            }
            state.sort((a, b) => b.active - a.active);
            return state;
        });

        appState.update((state) => {
            state.loading = false;
            return state;
        });
    }
</script>

<Header onClickSearchAndReplace={onClickSearchAndReplace} />

<!-- Body -->
<div class='popup-body overflow-y-auto pr-1'>
    <SearchReplaceFields />
</div>

<Footer />