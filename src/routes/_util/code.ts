import { type LanguageOption } from '$lib/stores';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { type LanguageSupport } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { type Extension } from '@codemirror/state';

export const getEditorTheme = (theme?: string): Extension | null => {
	return theme === 'dark' ? oneDark : null;
};

export const getEditorLanguage = (lang: LanguageOption): LanguageSupport | null => {
	if (lang === 'javascript') {
		return javascript();
	} else if (lang === 'typescript') {
		return javascript({ typescript: true });
	} else if (lang === 'html') {
		return html({ matchClosingTags: true });
	} else if (lang === 'css') {
		return css();
	} else if (lang === 'markdown') {
		return markdown();
	} else if (lang === 'json') {
		return json();
	} else if (lang === 'sql') {
		return sql();
	} else if (lang === 'python') {
		return python();
	} else if (lang === 'java') {
		return java();
	}
	return null;
};

export const javascriptValue = (): string => `/**
 * Reduce calls to the passed function.
 *
 * @param func - Function to debounce.
 * @param threshold - The delay to avoid recalling the function.
 * @param execAsap - If true, the Function is called at the start of the threshold, otherwise the Function is called at the end of the threshold.
 */
export function debounce(func, threshold, execAsap = false) {
  let timeout;

  return function debounced(...args) {
    const self = this;

    if (timeout) clearTimeout(timeout);
    else if (execAsap) func.apply(self, args);

    timeout = setTimeout(delayed, threshold || 100);

    function delayed() {
      if (!execAsap) func.apply(self, args);
      timeout = null;
    }
  };
}`;

export const typescriptValue = (): string => `/**
 * Reduce calls to the passed function.
 *
 * @param func - Function to debounce.
 * @param threshold - The delay to avoid recalling the function.
 * @param execAsap - If true, the Function is called at the start of the threshold, otherwise the Function is called at the end of the threshold.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, threshold: number, execAsap = false): T {
  let timeout: any;

  return function debounced(...args: any[]): any {
    const self = this;

    if (timeout) clearTimeout(timeout);
    else if (execAsap) func.apply(self, args);

    timeout = setTimeout(delayed, threshold || 100);

    function delayed(): void {
      if (!execAsap) func.apply(self, args);
      timeout = null;
    }
  } as T;
}`;

export const htmlValue = (): string => `<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="icon" href="/favicon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
      html {
        font-family: sans-serif;
      }

      h1 {
        text-align: center;
        margin-bottom: 3rem;
      }  

      main {
        margin: 2rem 0;
      }
    </style>
  </head>
  <body>
    <h1>Hello world!</h1>
    <main>
      <p>Welcome on Codemirror</p>
    </main>
    <script>
      /**
       * Reduce calls to the passed function.
       *
       * @param func - Function to debounce.
       * @param threshold - The delay to avoid recalling the function.
       * @param execAsap - If true, the Function is called at the start of the threshold, otherwise the Function is called at the end of the threshold.
       */
      function debounce(func, threshold, execAsap = false) {
        let timeout;

        return function debounced(...args) {
          const self = this;

          if (timeout) clearTimeout(timeout);
          else if (execAsap) func.apply(self, args);

          timeout = setTimeout(delayed, threshold || 100);

          function delayed() {
            if (!execAsap) func.apply(self, args);
            timeout = null;
          }
        };
      }
    </script>
  </body>
</html>`;

export const cssValue = (): string => `html {
  font-family: sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 3rem;
}

main {
  margin: 2rem 0;
}`;

export const markdownValue = (): string => `---
__Advertisement :)__

- __[pica](https://nodeca.github.io/pica/demo/)__ - high quality and fast image
  resize in browser.
- __[babelfish](https://github.com/nodeca/babelfish/)__ - developer friendly
  i18n with plurals support and easy syntax.

You will like those projects!

---

# h1 Heading 8-)
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading


## Horizontal Rules

___

---

***


## Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'


## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~


## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.


## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar


## Code

Inline \`code\`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

\`\`\`
Sample text here...
\`\`\`

Syntax highlighting

\`\`\` js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
\`\`\`

## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


## Links

[link text](http://dev.nodeca.com)

[link with title](http://nodeca.github.io/pica/demo/ "title text!")

Autoconverted link https://github.com/nodeca/pica (enable linkify to see)


## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

Like links, Images also have a footnote style syntax

![Alt text][id]

With a reference later in the document defining the URL location:

[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"


## Plugins

The killer feature of \`markdown-it\` is very effective support of
[syntax plugins](https://www.npmjs.org/browse/keyword/markdown-it-plugin).


### [Emojies](https://github.com/markdown-it/markdown-it-emoji)

> Classic markup: :wink: :crush: :cry: :tear: :laughing: :yum:
>
> Shortcuts (emoticons): :-) :-( 8-) ;)

see [how to change output](https://github.com/markdown-it/markdown-it-emoji#change-output) with twemoji.


### [Subscript](https://github.com/markdown-it/markdown-it-sub) / [Superscript](https://github.com/markdown-it/markdown-it-sup)

- 19^th^
- H~2~O


### [\\<ins>](https://github.com/markdown-it/markdown-it-ins)

++Inserted text++


### [\\<mark>](https://github.com/markdown-it/markdown-it-mark)

==Marked text==


### [Footnotes](https://github.com/markdown-it/markdown-it-footnote)

Footnote 1 link[^first].

Footnote 2 link[^second].

Inline footnote^[Text of inline footnote] definition.

Duplicated footnote reference[^second].

[^first]: Footnote **can have markup**

    and multiple paragraphs.

[^second]: Footnote text.


### [Definition lists](https://github.com/markdown-it/markdown-it-deflist)

Term 1

:   Definition 1
with lazy continuation.

Term 2 with *inline markup*

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.

_Compact style:_

Term 1
  ~ Definition 1

Term 2
  ~ Definition 2a
  ~ Definition 2b


### [Abbreviations](https://github.com/markdown-it/markdown-it-abbr)

This is HTML abbreviation example.

It converts "HTML", but keep intact partial entries like "xxxHTMLyyy" and so on.

*[HTML]: Hyper Text Markup Language

### [Custom containers](https://github.com/markdown-it/markdown-it-container)

::: warning
*here be dragons*
:::

`;

export const sqlValue = (): string => `SELECT * FROM Customers
WHERE id = 123
ORDER BY Country
`;

export const jsonValue = (): string => `{
  "menu": {
    "id": "file",
    "value": "File",
    "popup": {
      "menuitem": [
        {"value": "New", "onclick": "CreateNewDoc()"},
        {"value": "Open", "onclick": "OpenDoc()"},
        {"value": "Close", "onclick": "CloseDoc()"}
      ]
    }
  }
}
`;