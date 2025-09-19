# PRD: `sortable` Code-Block Plugin (React, ultra-minimal)

## Goal

Enable drag‑and‑drop reordering of simple lists **inside a markdown note** by rendering a code block like:

````markdown
```sortable
- Item A
- Item B
- Item C
```
````

The plugin renders that block as a draggable list (in Reading mode). When the user reorders items, the plugin **writes the new order back** to the note by updating the code‑block’s contents. Keep implementation tiny and React-based so Claude Code can extend it quickly.

```sortable
- Item B
- Item C
- Item C
- Item C
- Item C
- Item C
- Item C
- Item C
- Item C
- Item A
- Item C
```



```sortable
- Item C
- Item C
- Item C
- Item A
- Item C
- Item C
- Item C
- Item C
- Item B
- Item C
- Item C
```
## Scope (v0.1)

- Reading mode only (no Live Preview editing integration needed for v0.1).
    
- Support unordered list lines beginning with `-` , `*` or `+` , and also plain lines (no nesting in v0.1).
    
- **NEW:** Support Markdown checkbox items: `- [ ] task` and `- [x] task` (render a checkbox, allow toggling, and persist state to the block).
    
- Drag using mouse/touch.
    
- Persist order by rewriting only the fenced block body.
    
- Zero fancy styling.
    

## Out of scope (v0.1)

- Nested lists / hierarchy
      
- Multi‑block or cross‑note ordering
    
- Custom item templates, keyboard shortcuts
    

## User Stories

1. As a user, I can write a ` ```sortable ` block with a list of items.
    
2. In Reading mode, I can drag items to reorder.
    
3. On drop, the underlying markdown of that block is rewritten to match the new order.
    

## Success Criteria / Acceptance

- Dropping an item updates the markdown block within <200ms on typical notes (<100 items).
    
- Reopening the note shows the new order.
    
- No change to text outside the block.
    
- If the note is changed externally while dragging, safe‑guarded by reading current file before write and only replacing the block’s range if it hasn’t shifted.
    

## Block Grammar

````
```sortable
<line 1>
<line 2>
...
```
````

- Lines may be:
    
    - bullet only: `- Foo`
        
    - checkbox (unchecked): `- [ ] Foo`
        
    - checkbox (checked): `- [x] Foo`
        
- We **preserve** the original bullet symbol and checkbox token when writing back.
    

## Tech Choices

- **React** for UI
    
- **SortableJS** for drag‑drop (tiny, battle‑tested)
    
- Plain CSS (no Tailwind required). Keep bundle small.
    

## Edge Handling

- If two `sortable` blocks exist in the same note, each updates only its own fenced region.
    
- If the file moves, use the `MarkdownPostProcessorContext`’s file reference at render time.
    
- If parsing fails, render a read‑only pre block fallback (no write).
    

---

# Starter Repo Layout

```
obsidian-sortable/
├─ manifest.json
├─ package.json
├─ tsconfig.json
├─ versions.json
├─ styles.css
├─ src
   └─  main.ts
     └─ ui/
	   └─ SortableBlock.tsx
```

---

# `manifest.json`

```json
{
  "id": "sortable-codeblock",
  "name": "Sortable Code Block",
  "version": "0.1.0",
  "minAppVersion": "1.6.0",
  "description": "Drag-and-drop reorder for items inside ```sortable code blocks (React)",
  "author": "You",
  "authorUrl": "",
  "isDesktopOnly": false
}
```

# `package.json`

```json
{
  "name": "obsidian-sortable-codeblock",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "scripts": {
    "dev": "esbuild main.ts --bundle --outfile=main.js --format=cjs --platform=browser --external:obsidian --watch",
    "build": "esbuild main.ts --bundle --outfile=main.js --format=cjs --platform=browser --external:obsidian"
  },
  "devDependencies": {
    "@types/sortablejs": "^1.15.8",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "esbuild": "^0.21.0",
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "sortablejs": "^1.15.3"
  }
}
```

# `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["DOM", "ES2020"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

# `styles.css`

```css
.sortable-container {
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 6px 8px;
}
.sortable-item {
  padding: 6px 8px;
  margin: 4px 0;
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
}
.sortable-item.dragging {
  opacity: 0.7;
}
```

---

# `main.ts`

````ts
import { App, MarkdownPostProcessorContext, Plugin, TFile } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import SortableBlock, { Item, CheckboxState } from './ui/SortableBlock';

export default class SortableCodeblockPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor('sortable', (source, el, ctx) => {
      const mount = el.createDiv({ cls: 'sortable-container' });
      const root = ReactDOM.createRoot(mount);

      // Parse lines with optional checkbox tokens
      const rawLines = source.split('\n').filter(l => l.trim().length > 0);
      const items: Item[] = rawLines.map((line) => {
        // Capture bullet, optional checkbox token, and text
        // groups: 1=bullet (incl. leading spaces), 2=checkbox token like "[ ] " or "[x] ", 3=text
        const m = line.match(/^(\s*[-*+]\s)(?:\[((?: |x|X))\]\s)?(.*)$/);
        if (m) {
          const bullet = m[1];
          const checkboxRaw = m[2];
          const text = m[3] ?? '';
          let checkbox: CheckboxState = 'none';
          if (checkboxRaw === ' ') checkbox = 'unchecked';
          else if (checkboxRaw && checkboxRaw.toLowerCase() === 'x') checkbox = 'checked';
          return { bullet, checkbox, text };
        }
        // plain line fallback (no bullet)
        return { bullet: '', checkbox: 'none', text: line };
      });

      const writeBack = async (updatedItems: Item[], mutateIndex?: number, mutateCheckbox?: CheckboxState) => {
        const info = ctx.getSectionInfo(el);
        const tfile = this.app.vault.getAbstractFileByPath(ctx.sourcePath || '') as TFile | null;
        if (!info || !tfile) return;
        const current = await this.app.vault.read(tfile);
        const { lineStart, lineEnd } = info;
        const lines = current.split('\n');
        const bodyStart = lineStart + 1;
        const bodyEnd = lineEnd - 1;

        // If a single checkbox toggle was requested, reflect it in the array copy
        const arr = updatedItems.map((it) => ({ ...it }));
        if (typeof mutateIndex === 'number' && mutateCheckbox) {
          arr[mutateIndex].checkbox = mutateCheckbox;
        }

        const tokenFor = (c: CheckboxState) => c === 'none' ? '' : (c === 'checked' ? '[x] ' : '[ ] ');
        const newBody = arr.map(i => (i.bullet || '- ') + tokenFor(i.checkbox) + i.text).join('\n');

        const updated = [
          ...lines.slice(0, bodyStart),
          newBody,
          ...lines.slice(bodyEnd)
        ].join('\n');

        if (updated !== current) await this.app.vault.modify(tfile, updated);
      };

      const onReorder = async (newOrder: Item[]) => {
        await writeBack(newOrder);
      };

      const onToggle = async (index: number, nextState: CheckboxState, currentItems: Item[]) => {
        await writeBack(currentItems, index, nextStat# `ui/SortableBlock.tsx`
```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sortable from 'sortablejs';

export type CheckboxState = 'none' | 'unchecked' | 'checked';
export type Item = { bullet: string; checkbox: CheckboxState; text: string };

export default function SortableBlock({
  items,
  onReorder,
  onToggle,
}: {
  items: Item[];
  onReorder: (items: Item[]) => void;
  onToggle: (index: number, next: CheckboxState, currentItems: Item[]) => void;
}) {
  const [state, setState] = useState(items);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;

    const sortable = new Sortable(listRef.current, {
      animation: 150,
      ghostClass: 'dragging',
      draggable: '.sortable-item',
      onEnd: (evt) => {
        setState((prev) => {
          const newArr = [...prev];
          const [moved] = newArr.splice(evt.oldIndex!, 1);
          newArr.splice(evt.newIndex!, 0, moved);
          onReorder(newArr);
          return newArr;
        });
      },
    });

    return () => sortable.destroy();
  }, [onReorder]);

  const toggleAt = (i: number) => {
    setState((prev) => {
      const next = [...prev];
      const cur = next[i];
      const nextState: CheckboxState = cur.checkbox === 'checked' ? 'unchecked' : 'checked';
      next[i] = { ...cur, checkbox: nextState };
      onToggle(i,-based parsing and group dragging).
- Add `title:` option on the opening fence (e.g., ```sortable title:"Backlog" ).
- Option to keep or strip bullet prefixes on write.
- Live Preview support via a `MarkdownRenderChild` + editor transactions.

````