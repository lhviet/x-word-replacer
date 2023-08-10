<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import { type LanguageOption } from '$lib/stores';

    const languages: LanguageOption[] = ['text', 'markdown', 'javascript', 'typescript', 'css', 'html', 'json', 'sql', 'python', 'java'];
    export let value = 'text';

    let isOpen = false;

    function onDropdownClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        isOpen = !isOpen;

        // Because we stopPropagation, we need to manually update Value (checked) of input
        const dropdown = document.querySelector('.dropdown-el');
        if (dropdown) {
            const input = document.querySelector(`#${(e.target as HTMLElement).getAttribute('for')}`) as HTMLInputElement;
            input.checked = true;
            if (input.value !== value) {
                value = input.value;
                dispatch('update', { value });
            }
        }
    }
</script>

<span role="radiogroup" id="codemirror-language-selector" class="dropdown-el {isOpen ? 'expanded' : ''}" on:click={onDropdownClick}>
    {#each languages as lang, index}
        <input type="radio" value={lang} bind:group={value} id={lang} tabindex={index + 1} />
        <label for={lang}>{lang}</label>
    {/each}
</span>

<style lang='scss'>
    $color: #032b44;
    $timing:.2s;

    .dropdown-el {
        min-width: 7.5em;
        position: relative;
        display: inline-block;
        margin-right: 1em;
        min-height: 2em;
        max-height: 2em;
        overflow:hidden;
        cursor: pointer;
        text-align: left;
        white-space: nowrap;
        //color: #efefef;
        color: #444;

        outline: none;
        border: .06em solid mix($color,#fff,65%);
        border-radius: 6px;
        //background-color: mix($color,#fff,65%);

        transition: $timing all ease-in-out;
        input:focus + label {
            background: #def;
            color: #444;
        }
        input {
            width: 1px;
            height: 1px;
            display: inline-block;
            position: absolute;
            opacity: 0.01;
        }
        label {
            border-bottom: .06em solid #d9d9d9;
            display:block;
            height: 2em;
            line-height: 2em;
            padding-left: .6em;
            padding-right: .6em;
            cursor: pointer;
            position: relative;
            transition: $timing color ease-in-out;

            &:nth-child(2) {
                margin-top: 2em;
                border-bottom: .06em solid #d9d9d9;
            }
        }
        input:checked + label {
            display:block;
            border-bottom: none;
            position: absolute;
            bottom: 0;
            width: 100%;
            font-weight: 500;
            z-index: 1;

            &:nth-child(2) {
                margin-top: 0;
                position: relative;
            }
        }

        &::after {
            content:"";
            position: absolute;
            right: 0.6em;
            bottom: 0.8em;
            border: .3em solid $color;
            border-color: transparent transparent $color transparent;
            transition: $timing all ease-in-out;
        }
        &.expanded {
            border: .06em solid $color;
            background: #fff;
            color: #444;
            border-radius: .25em;
            padding: 0;
            box-shadow: rgba(0, 0, 0, 0.1) 3px 3px 5px 0px;
            max-height: 22em;
            margin-top: -18.7em;

            label {
                border-bottom: .06em solid #d9d9d9;

                &:hover {
                    background-color: mix($color,#fff,25%);
                }
                &:nth-child(2) {
                    margin-top: 0;
                    position: relative;
                }
            }
            input:checked + label {
                color: $color;
                background: white;
            }

            &::after {
                transform: rotate(-180deg);
                bottom:.5em;
                z-index: 1;
            }
        }
    }
</style>