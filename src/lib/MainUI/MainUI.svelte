<style lang="scss">
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

    footer {
        label {
            font-size: .9rem;
            font-weight: 300;
            color: #636363;
        }

        h4 {
            margin-top: 0;
            margin-bottom: .5rem;
        }

        i {
            font-size: .8rem
        }
    }

    .form-donate {
        display: inline-table;
        vertical-align: middle;
        margin: 0;
        padding: 0;
    }
</style>

<script lang='ts'>
    import '../../styles.scss';

    import { getCurrentTab } from '$lib/chrome-helper/tab';
    import { colorPalettes } from '$lib/colors';
    import { appState, localAppState, searchConfigState, searchReplaceState } from '$lib/stores';
    import TransparentBtn from '$lib/components/TransparentBtn';
    import UltraNotesBtn from '$lib/components/UltraNotesBtn';

    import { Button } from "$lib/components/ui/button";
    import { Switch } from "$lib/components/ui/switch";
    import * as Table from "$lib/components/ui/table";
    import { Input } from "$lib/components/ui/input";
    import { SquarePlus, SquareX } from 'lucide-svelte';
    import { Separator } from '$lib/components/ui/separator';


    // Add new fields of Search & handleReplace
    function addNewField() {
        searchReplaceState.update((state) => {
            const color = colorPalettes[state.length % colorPalettes.length];
            state.push({
                active: true,
                search: '',
                replace: '',
                backgroundColor: color[0],
                textColor: color[1],
            });
            state.sort((a, b) => b.active - a.active);
            return state;
        });
    }

    function removeSearchField(index: number) {
        searchReplaceState.update((state) => {
            state.splice(index, 1);
            state.sort((a, b) => b.active - a.active);

            return state;
        });
    }

    function clearSearch(index: number) {
        searchReplaceState.update((state) => {
            state[index].search = '';
            return state;
        });
    }

    function clearReplace(index: number) {
        searchReplaceState.update((state) => {
            state[index].replace = '';
            return state;
        });
    }

    const onClickSearchAndReplace = async () => {
        appState.update((state) => {
            state.loading = true;
            return state;
        });

        const tab = await getCurrentTab();
        if (tab && tab.id) {
            const result = await chrome.tabs.sendMessage(tab.id, 'searchAndReplaceInContentScript');
            searchReplaceState.update((state) => {
                for (const field of state) {
                    const resultItem = result[field.search];
                    field['count'] = resultItem ?? 0;
                }
                state.sort((a, b) => b.active - a.active);
                return state;
            });
        }

        appState.update((state) => {
            state.loading = false;
            return state;
        });
    }

    const onClickSearchAndHighlight = async () => {
        appState.update((state) => {
            state.loading = true;
            return state;
        });

        const tab = await getCurrentTab();
        if (tab && tab.id) {
            const result = await chrome.tabs.sendMessage(tab.id, 'searchAndHighlightInContentScript');
            searchReplaceState.update((state) => {
                for (const field of state) {
                    const resultItem = result[field.search];
                    field['count'] = resultItem ?? 0;
                }
                state.sort((a, b) => b.active - a.active);
                return state;
            });
        }

        appState.update((state) => {
            state.loading = false;
            return state;
        });
    }

    function loseSearchFocus() {
        if ($searchConfigState.autoHighlight) {
            onClickSearchAndHighlight();
        }
    }

</script>

<!-- Hearder -->
<div>
    <div class='p-2 flex justify-between items-center'>
        <div class="flex gap-1 items-center">
            <img src={chrome.runtime.getURL('static/images/icon_128.png')} width="35" height="35" />
            <Switch class="h-5 align-middle data-[state=checked]:bg-blue-500" bind:checked={$localAppState.floatingBtn} />
        </div>

        {#if $appState.loading}
            <div style='display: inline-block; margin-left: 10px;'>
                Loading...
            </div>
        {/if}

        <div>
            <div class="inline-block mr-2"><UltraNotesBtn /></div>
            <Button on:click={onClickSearchAndReplace}>Replace</Button>
        </div>
    </div>
    <Separator class="bg-slate-300" />
</div>

<!-- Body -->
<div class='popup-body overflow-y-auto pr-1'>
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head class="w-[1rem] text-left p-1">#</Table.Head>
                <Table.Head class="w-[1rem] p-1"></Table.Head>
                <Table.Head class="text-slate-800 p-1">
                    <Switch class="h-auto align-middle data-[state=checked]:bg-slate-400" bind:checked={$searchConfigState.autoHighlight} /> Auto
                    <Button class="bg-yellow-300 hover:bg-yellow-400 border-slate-400 border-[1px] text-primary px-2 py-1 h-7 ml-1" on:click={onClickSearchAndHighlight}>Highlight</Button>
                </Table.Head>
                <Table.Head class="w-auto p-0"></Table.Head>
                <Table.Head class="p-1">Replace by</Table.Head>
                <Table.Head class="text-right p-0">
                    <TransparentBtn on:click={addNewField} class="align-middle">
                        <SquarePlus class="h-6 w-6 text-blue-800 hover:text-green-900" />
                    </TransparentBtn>
                </Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each $searchReplaceState as field, i}
                <Table.Row class="p-2 pl-0">
                    <Table.Cell class="text-xs px-1">{i + 1}</Table.Cell>
                    <Table.Cell class="text-xs p-0">
                        <input type='checkbox' class="align-middle" bind:checked={field.active} />
                    </Table.Cell>
                    <Table.Cell class="relative px-2 py-1">
                        <Input bind:value={field.search} on:focusout={loseSearchFocus} class="p-1 h-auto" style='background-color: {field.backgroundColor}; color: {field.textColor}' />
                        <TransparentBtn class="absolute right-3.5 top-2 text-slate-700 hover:text-destructive" on:click={() => clearSearch(i)}>x</TransparentBtn>
                    </Table.Cell>
                    <Table.Cell class="p-0">
                        {#if field.count}
                            {field.count}
                        {/if}
                    </Table.Cell>
                    <Table.Cell class="relative px-2 py-1">
                        <Input bind:value={field.replace} class="p-1 h-auto bg-secondary" />
                        <TransparentBtn class="absolute right-3.5 top-2 text-slate-700 hover:text-destructive" on:click={() => clearReplace(i)}>x</TransparentBtn>
                    </Table.Cell>
                    <Table.Cell class="text-center p-0">
                        <TransparentBtn class="align-middle" on:click={() => removeSearchField(i)}>
                            <SquareX class="h-5 w-5 text-gray-500" />
                        </TransparentBtn>
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</div>

<footer class="relative">
    <Separator class="bg-slate-300" />
    <div class="py-1 px-2">
        <table>
        <tbody>
        <tr>
            <td style="width: 190px;">
                <table>
                    <tbody>
                    <tr>
                        <td>
                            <input id='idIsMatchCase' type='checkbox' class='mr-2' bind:checked={$searchConfigState.matchCase} />
                        </td>
                        <td>
                            <label for='idIsMatchCase'>Match Case (regex /i)</label>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <input id='idIsRegexUsing' type='checkbox' class='mr-2' bind:checked={$searchConfigState.regex} />
                        </td>
                        <td>
                            <label for='idIsRegexUsing'>
                                <a class="text-blue-700 underline" target="_blank" href="https://viet.pughtml.com/posts/post-7-x-word-replacer-multi-highlight-with-regex">Use Regular Expression</a>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <input id='idIsTextInputFields' type='checkbox' class='mr-2' bind:checked={$searchConfigState.textInputFields} />
                        </td>
                        <td>
                            <label for='idIsTextInputFields'>Input/TextArea</label>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <input id='idIsWebpage' type='checkbox' class='mr-2' bind:checked={$searchConfigState.webpage} />
                        </td>
                        <td>
                            <label for='idIsWebpage'>Web page</label>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
            <td style='text-align:center;'><h4>Help maintaining this app</h4>
                <form class='form-donate' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_blank'
                      style='display:inline-table;'>
                    <input type='hidden' name='cmd' value='_s-xclick' />
                    <input type='hidden'
                           name='hosted_button_id'
                           value='XR358N3E9F5MN' />
                    <input
                      type='image' src='https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif' name='submit'
                      alt='PayPal - The safer, easier way to pay online!' />
                    <img alt='' border='0'
                         src='https://www.paypalobjects.com/en_US/i/scr/pixel.gif'
                         width='1' height='1' />
                </form>
                <table style="text-align: left">
                    <tbody>
                    <tr>
                        <td>
                            <input id='idIsHTML' type='checkbox' class='mr-2' bind:checked={$searchConfigState.html} />
                        </td>
                        <td>
                            <label for='idIsHTML'>Raw HTML <i>(modify html may break your page)</i></label>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
    </div>
</footer>