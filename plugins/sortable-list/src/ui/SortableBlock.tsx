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
  console.log('🔄 SortableBlock render - incoming items:', items);

  // Add stable IDs to items for React keys
  const [state, setState] = useState(() => {
    const initialState = items.map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${item.text}-${Math.random().toString(36).substr(2, 9)}`
    }));
    console.log('🆕 Initial state created:', initialState);
    return initialState;
  });

  console.log('📊 Current state:', state);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sortableRef = useRef<Sortable | null>(null);

  useEffect(() => {
    console.log('🔧 Setting up SortableJS...');
    if (!listRef.current) return;

    sortableRef.current = new Sortable(listRef.current, {
      animation: 150,
      ghostClass: 'dragging',
      draggable: '.sortable-item',
      onStart: (evt) => {
        console.log('🏁 Drag started:', {
          oldIndex: evt.oldIndex,
          item: evt.item,
          clone: evt.clone
        });
      },
      onEnd: (evt) => {
        console.log('🏁 Drag ended:', {
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex,
          item: evt.item
        });

        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          setState((prev) => {
            console.log('📝 setState called - prev state:', prev);
            console.log('📝 Moving from index', evt.oldIndex, 'to index', evt.newIndex);

            const newArr = [...prev];
            console.log('📝 Array before splice:', newArr);

            const [moved] = newArr.splice(evt.oldIndex!, 1);
            console.log('📝 Moved item:', moved);
            console.log('📝 Array after removal:', newArr);

            newArr.splice(evt.newIndex!, 0, moved);
            console.log('📝 Array after insertion:', newArr);

            // Call onReorder with items without the id field
            const itemsWithoutId = newArr.map(({ id, ...item }) => item);
            console.log('📤 Calling onReorder with:', itemsWithoutId);
            onReorder(itemsWithoutId);

            return newArr;
          });
        } else {
          console.log('⚠️ Missing oldIndex or newIndex:', evt);
        }
      },
    });

    console.log('✅ SortableJS initialized:', sortableRef.current);

    return () => {
      if (sortableRef.current) {
        console.log('🧹 Destroying SortableJS');
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