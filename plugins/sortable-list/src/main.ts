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
      console.log('🔍 Parsing source:', { source, rawLines });

      const items: Item[] = rawLines.map((line): Item => {
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
          const item = { bullet, checkbox, text };
          console.log('✅ Parsed item:', { line, item });
          return item;
        }
        // plain line fallback (no bullet)
        const item: Item = { bullet: '', checkbox: 'none', text: line };
        console.log('📝 Plain item:', { line, item });
        return item;
      });

      console.log('📋 Final parsed items:', items);

      const writeBack = async (updatedItems: Item[], mutateIndex?: number, mutateCheckbox?: CheckboxState) => {
        console.log('💾 writeBack called with:', {
          updatedItems,
          mutateIndex,
          mutateCheckbox
        });

        const info = ctx.getSectionInfo(el);
        const tfile = this.app.vault.getAbstractFileByPath(ctx.sourcePath || '') as TFile | null;
        if (!info || !tfile) {
          console.log('❌ Missing info or tfile:', { info, tfile });
          return;
        }

        const current = await this.app.vault.read(tfile);
        const { lineStart, lineEnd } = info;
        const lines = current.split('\n');
        const bodyStart = lineStart + 1;  // First line after opening ```sortable
        const bodyEnd = lineEnd - 1;      // Last line before closing ```

        console.log('📄 File info:', {
          lineStart,
          lineEnd,
          bodyStart,
          bodyEnd,
          currentLines: lines.length,
          originalBody: lines.slice(bodyStart, bodyEnd),
          lineAtStart: lines[lineStart],
          lineAtEnd: lines[lineEnd],
          linesBeingReplaced: lines.slice(bodyStart, bodyEnd),
          actualContentToReplace: lines.slice(bodyStart, bodyEnd).join('\n')
        });

        // If a single checkbox toggle was requested, reflect it in the array copy
        const arr = updatedItems.map((it) => ({ ...it }));
        if (typeof mutateIndex === 'number' && mutateCheckbox) {
          arr[mutateIndex].checkbox = mutateCheckbox;
          console.log('☑️ Checkbox toggle applied:', arr[mutateIndex]);
        }

        const tokenFor = (c: CheckboxState) => c === 'none' ? '' : (c === 'checked' ? '[x] ' : '[ ] ');
        const newBody = arr.map(i => (i.bullet || '- ') + tokenFor(i.checkbox) + i.text).join('\n');

        console.log('📝 Generated new body:', newBody);

        // Ensure we're replacing exactly the right content
        // lines[bodyStart] through lines[bodyEnd-1] should be replaced with newBody
        const beforeLines = lines.slice(0, bodyStart);
        const afterLines = lines.slice(bodyEnd);

        console.log('🔧 Reconstruction Details:', {
          totalLines: lines.length,
          beforeCount: beforeLines.length,
          replacingLineRange: `${bodyStart} to ${bodyEnd-1}`,
          afterCount: afterLines.length,
          newBodyLines: newBody.split('\n').length,
          oldContent: lines.slice(bodyStart, bodyEnd).join('\n'),
          newContent: newBody,
          reconstructedLength: beforeLines.length + newBody.split('\n').length + afterLines.length
        });

        // Reconstruct the file: before + newBody + after
        const updatedLines = [
          ...beforeLines,
          ...newBody.split('\n'),
          ...afterLines
        ];

        const updated = updatedLines.join('\n');

        console.log('📄 Final reconstruction check:', {
          originalLines: lines.length,
          updatedLines: updatedLines.length,
          lineDifference: updatedLines.length - lines.length
        });

        console.log('📄 File update:', {
          changed: updated !== current,
          originalLength: current.length,
          newLength: updated.length
        });

        if (updated !== current) {
          console.log('💾 Writing file...');
          await this.app.vault.modify(tfile, updated);
          console.log('✅ File written successfully');
        } else {
          console.log('ℹ️ No changes detected, skipping write');
        }
      };

      const onReorder = async (newOrder: Item[]) => {
        console.log('🔄 onReorder called with:', newOrder);
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