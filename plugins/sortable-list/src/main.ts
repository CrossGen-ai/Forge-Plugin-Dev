import { Plugin, TFile } from 'obsidian';
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
        const m = line.match(/^(\s*[-*+]\s)(?:\[(( |x|X))\]\s)?(.*)$/);
        if (m) {
          const bullet = m[1];
          const checkboxRaw = m[2];
          const text = m[4] ?? '';
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
        await writeBack(currentItems, index, nextState);
      };

      try {
        root.render(React.createElement(SortableBlock, {
          items,
          onReorder,
          onToggle,
        }));
      } catch (error) {
        // Fallback: render as read-only pre block
        el.empty();
        const pre = el.createEl('pre');
        pre.textContent = source;
        console.error('SortableBlock render failed:', error);
      }
    });
  }

  onunload() {
    // React roots are automatically cleaned up when DOM elements are removed
  }
}