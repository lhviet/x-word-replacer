<script lang="ts" context="module">
  export type ThemeSpec = Record<string, StyleSpec>;
  export type StyleSpec = {
    [propOrSelector: string]: string | number | StyleSpec | null;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { basicSetup } from "codemirror";
  import { EditorView, keymap, placeholder as placeholderExt, type Panel, showPanel } from "@codemirror/view";
  import { EditorState, StateEffect, type Extension, Text } from "@codemirror/state";
  import { indentWithTab } from "@codemirror/commands";
  import { indentUnit, type LanguageSupport } from "@codemirror/language";
  import { debounce } from "./util";

  let classes = "";
  export { classes as class };
  export let value: string | null | undefined = "";

  export let basic = true;
  export let language: LanguageSupport | null | undefined = undefined;
  export let theme: Extension | null | undefined = undefined;
  export let extensions: Extension[] = [];

  export let tabSize = 2;
  export let styles: ThemeSpec | null | undefined = undefined;
  export let lineWrapping = false;
  export let editable = true;
  export let readonly = false;
  export let wordCount = true;
  export let placeholder: string | HTMLElement | null | undefined = undefined;

  const is_browser = typeof window !== "undefined";
  const dispatch = createEventDispatcher<{ change: string }>();

  let element: HTMLDivElement;
  let view: EditorView;

  let update_from_prop = false;
  let update_from_state = false;
  let first_config = true;
  let first_update = true;

  $: state_extensions = [
    ...get_base_extensions(basic, tabSize, lineWrapping, placeholder, editable, readonly, language, wordCount),
    ...get_theme(theme, styles),
    ...extensions,
  ];

  $: view && update(value);
  $: view && state_extensions && reconfigure();

  onMount(() => (view = create_editor_view()));
  onDestroy(() => view?.destroy());

  function create_editor_view(): EditorView {
    const on_change = debounce(handle_change, 300);

    return new EditorView({
      parent: element,
      state: create_editor_state(value),
      dispatch(transaction) {
        view.update([transaction]);

        if (!update_from_prop && transaction.docChanged) {
          on_change();
        }
      },
    });
  }

  function reconfigure(): void {
    if (first_config) {
      first_config = false;
      return;
    }

    view.dispatch({
      effects: StateEffect.reconfigure.of(state_extensions),
    });
  }

  function update(value: string | null | undefined): void {
    if (first_update) {
      first_update = false;
      return;
    }

    if (update_from_state) {
      update_from_state = false;
      return;
    }

    update_from_prop = true;

    view.setState(create_editor_state(value));

    update_from_prop = false;
  }

  function handle_change(): void {
    const new_value = view.state.doc.toString();
    if (new_value === value) return;

    update_from_state = true;

    value = new_value;
    dispatch("change", value);
  }

  function create_editor_state(value: string | null | undefined): EditorState {
    return EditorState.create({
      doc: value ?? undefined,
      extensions: state_extensions,
    });
  }

  function get_base_extensions(
    basic: boolean,
    tabSize: number,
    lineWrapping: boolean,
    placeholder: string | HTMLElement | null | undefined,
    editable: boolean,
    readonly: boolean,
    language: LanguageSupport | null | undefined,
    wordCount: boolean,
  ): Extension[] {
    const extensions: Extension[] = [
      indentUnit.of(" ".repeat(Math.max(tabSize, 1))),
      EditorView.editable.of(editable),
      EditorState.readOnly.of(readonly),
    ];

    if (basic) extensions.push(basicSetup);
    if (tabSize > 0) extensions.push(keymap.of([indentWithTab]));
    if (placeholder) extensions.push(placeholderExt(placeholder));
    if (language) extensions.push(language);
    if (lineWrapping) extensions.push(EditorView.lineWrapping);
    if (wordCount) extensions.push(showPanel.of(wordCountPanel));

    return extensions;
  }

  function get_theme(theme: Extension | null | undefined, styles: ThemeSpec | null | undefined): Extension[] {
    const extensions: Extension[] = [];
    if (styles) extensions.push(EditorView.theme(styles));
    if (theme) extensions.push(theme);
    return extensions;
  }

  function countWords(doc: Text) {
      let count = 0, iter = doc.iter()
      while (!iter.next().done) {
          let inWord = false
          for (let i = 0; i < iter.value.length; i++) {
              let word = /\w/.test(iter.value[i])
              if (word && !inWord) count++
              inWord = word
          }
      }
      return `${count} words - ${doc.length} chars`;
  }
  function wordCountPanel(view: EditorView): Panel {
      let dom = document.createElement("div")
      dom.className = "scm-word-count-panel";
      dom.textContent = countWords(view.state.doc)
      return {
          dom,
          update(update) {
              if (update.docChanged)
                  dom.textContent = countWords(update.state.doc)
          }
      }
  }
</script>

{#if is_browser}
    <div class="codemirror-wrapper {classes}" bind:this={element} />
{:else}
    <div class="scm-waiting {classes}">
        <div class="scm-waiting__loading scm-loading">
            <div class="scm-loading__spinner" />
            <p class="scm-loading__text">Loading editor...</p>
        </div>

        <pre class="scm-pre cm-editor">{value}</pre>
    </div>
{/if}

<style lang='scss'>
    .codemirror-wrapper :global(.cm-focused) {
        outline: none;
    }
    .codemirror-wrapper :global(.cm-scroller) {
        overflow: auto;
        overflow-wrap: anywhere;

        /* Define the scrollbar style */
        &::-webkit-scrollbar {
            width: 0.5rem;
            height: 0.5rem;
        }

        /* Define the thumb style */
        &::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom right, #838383 30%, #2d2d2d 100%);
            border-radius: 3px;
        }

        /* Define the track style */
        &::-webkit-scrollbar-track {
            background-color: #adadad;
            border: none;
        }

        /* Define the button style */
        &::-webkit-scrollbar-button {
            display: none;
        }
    }

    .scm-waiting {
        position: relative;
    }
    .scm-waiting__loading {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: rgba(255, 255, 255, 0.5);
    }

    .scm-loading {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .scm-loading__spinner {
        width: 1rem;
        height: 1rem;
        border-radius: 100%;
        border: solid 2px #000;
        border-top-color: transparent;
        margin-right: 0.75rem;
        animation: spin 1s linear infinite;
    }
    .scm-loading__text {
        font-family: sans-serif;
    }
    .scm-pre {
        font-size: 0.85rem;
        font-family: monospace;
        tab-size: 2;
        -moz-tab-size: 2;
        resize: none;
        pointer-events: none;
        user-select: none;
        overflow: auto;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>