import type React from 'react';

let currentDraggedTaskId: string | null = null;

export function setActiveDraggedTaskId(id: string | null): void {
  currentDraggedTaskId = id;
}

export function getActiveDraggedTaskId(
  e?: React.DragEvent<HTMLElement> | DragEvent
): string | null {
  if (currentDraggedTaskId) return currentDraggedTaskId;
  try {
    const dtId = e?.dataTransfer?.getData('text/plain');
    if (dtId) return dtId;
  } catch {
    // ignore
  }
  return null;
}
