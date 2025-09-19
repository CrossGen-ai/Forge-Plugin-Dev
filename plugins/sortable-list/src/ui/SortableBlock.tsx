import React, { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';

export type CheckboxState = 'none' | 'unchecked' | 'checked';
export type Item = { bullet: string; checkbox: CheckboxState; text: string; id?: string };

export default function SortableBlock({
  items,
  onReorder,
  onToggle,
}: {
  items: Item[];
  onReorder: (items: Item[]) => void;
  onToggle: (index: number, next: CheckboxState, currentItems: Item[]) => void;
}) {
  // Add stable IDs to items for React keys
  const [state, setState] = useState(() =>
    items.map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${item.text}-${Math.random().toString(36).substr(2, 9)}`
    }))
  );

  const listRef = useRef<HTMLDivElement | null>(null);
  const sortableRef = useRef<Sortable | null>(null);

  useEffect(() => {
    if (!listRef.current) return;

    sortableRef.current = new Sortable(listRef.current, {
      animation: 150,
      ghostClass: 'dragging',
      draggable: '.sortable-item',
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          setState((prev) => {
            const newArr = [...prev];
            const [moved] = newArr.splice(evt.oldIndex!, 1);
            newArr.splice(evt.newIndex!, 0, moved);

            // Call onReorder with items without the id field
            const itemsWithoutId = newArr.map(({ id, ...item }) => item);
            onReorder(itemsWithoutId);

            return newArr;
          });
        }
      },
    });

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [onReorder]);

  const toggleAt = (i: number) => {
    setState((prev) => {
      const next = [...prev];
      const cur = next[i];
      const nextState: CheckboxState = cur.checkbox === 'checked' ? 'unchecked' : 'checked';
      next[i] = { ...cur, checkbox: nextState };

      // Call onToggle with items without the id field
      const itemsWithoutId = next.map(({ id, ...item }) => item);
      onToggle(i, nextState, itemsWithoutId);

      return next;
    });
  };

  return (
    <div ref={listRef}>
      {state.map((item, i) => (
        <div key={item.id} className="sortable-item" data-id={item.id}>
          {item.checkbox !== 'none' && (
            <input
              type="checkbox"
              checked={item.checkbox === 'checked'}
              onChange={() => toggleAt(i)}
              style={{ marginRight: '8px' }}
            />
          )}
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}