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
      onToggle(i, nextState, next);
      return next;
    });
  };

  return (
    <div ref={listRef}>
      {state.map((item, i) => (
        <div key={i} className="sortable-item">
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