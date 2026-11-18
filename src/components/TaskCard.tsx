import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckSquare, Maximize2 } from 'lucide-react';
import { hexToRgba } from '../utils/defaultData.ts';
import { getTaskProgress } from '../utils/progress.ts';
import { setActiveDraggedTaskId, getActiveDraggedTaskId } from '../utils/dragState.ts';
import type { Task, Category } from '../types/index.ts';

export interface TaskCardProps {
  task: Task;
  category: Category | null;
  isDragging: boolean;
  dropIndicator: 'before' | 'after' | null;
  disableCardDropTarget?: boolean;
  onToggleComplete: (taskId: string) => void;
  onRenameTask: (taskId: string, newTitle: string) => void;
  onOpenTask: (task: Task) => void;
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
  onDragOverTask: (targetTaskId: string, position: 'before' | 'after') => void;
  onDropOnTask: (draggedTaskId: string, targetTaskId: string, position: 'before' | 'after') => void;
  onPointerStartDrag?: (taskId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  compact?: boolean;
}

export function TaskCard({
  task,
  category,
  isDragging,
  dropIndicator,
  disableCardDropTarget = false,
  onToggleComplete,
  onRenameTask,
  onOpenTask,
  onDragStartTask,
  onDragEndTask,
  onDragOverTask,
  onDropOnTask,
  onPointerStartDrag,
  compact = false
}: TaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false as boolean);
  const [draftTitle, setDraftTitle] = useState(task.title as string);
  const inputRef = useRef(null as HTMLInputElement | null);
  const submittingRef = useRef(false as boolean);

  useEffect(() => {
    if (!isEditingTitle) {
      setDraftTitle(task.title);
    }
  }, [task.title, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      submittingRef.current = false;
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const totalSteps = task.subSteps.length;
  const completedSteps = task.subSteps.filter((s) => s.completed).length;
  const progress = getTaskProgress(task);
  const isFull = progress === 100;
  const accentColor = category ? category.color : '#217346';

  const commitInlineTitle = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const trimmed = draftTitle.trim();
    setIsEditingTitle(false);
    if (trimmed && trimmed !== task.title) {
      onRenameTask(task.id, trimmed);
    } else {
      setDraftTitle(task.title);
    }
  };

  const cancelInlineTitle = () => {
    submittingRef.current = true;
    setDraftTitle(task.title);
    setIsEditingTitle(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEditingTitle) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setActiveDraggedTaskId(task.id);
    if (e.dataTransfer) {
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
      } catch {
        // ignore
      }
    }
    onDragStartTask(task.id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveDraggedTaskId(null);
    onDragEndTask();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disableCardDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    const draggedId = getActiveDraggedTaskId(e);
    if (!draggedId || draggedId === task.id) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos: 'before' | 'after' = e.clientY < midY ? 'before' : 'after';
    onDragOverTask(task.id, pos);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disableCardDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    const draggedId = getActiveDraggedTaskId(e);
    if (!draggedId || draggedId === task.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos: 'before' | 'after' = e.clientY < midY ? 'before' : 'after';
    onDropOnTask(draggedId, task.id, pos);
    setActiveDraggedTaskId(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-no-drag="true"]')) return;
    if (onPointerStartDrag) {
      onPointerStartDrag(task.id, e);
    }
  };

  const cardClasses = [
    'af-task-card',
    task.completed ? 'af-task-card-completed' : '',
    isDragging ? 'af-task-card-dragging' : '',
    dropIndicator === 'before' ? 'af-task-drop-before' : '',
    dropIndicator === 'after' ? 'af-task-drop-after' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const badgeFont = compact ? '0.58rem' : '0.66rem';
  const badgePadding = compact ? '0.5px 4px' : '1px 5px';
  const barHeight = compact ? '3px' : '3.5px';

  return (
    <div
      draggable={!isEditingTitle}
      data-task-id={task.id}
      data-testid={`task-card-${task.id}`}
      className={cardClasses}
      style={{
        padding: compact ? '4px 7px 6px 5px' : '6px 10px 9px 7px',
        gap: compact ? '3px' : '5px'
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onClick={() => {
        if (!isEditingTitle) {
          onOpenTask(task);
        }
      }}
    >
      {/* Colored category accent strip */}
      <div
        className="af-task-accent-strip"
        style={{
          backgroundColor: accentColor,
          width: compact ? '2.5px' : '3px',
          right: compact ? '1.5px' : '2px'
        }}
      />

      {/* Dedicated Top Corner Expand Button (opposite side from checkbox & title start) */}
      <button
        type="button"
        data-no-drag="true"
        data-testid={`task-expand-btn-${task.id}`}
        className="af-card-expand-btn"
        style={{
          position: 'absolute',
          top: compact ? '4px' : '5px',
          left: compact ? '5px' : '7px',
          width: compact ? '15px' : '17px',
          height: compact ? '15px' : '17px'
        }}
        title="فتح تفاصيل المهمة والخطوات الفرعية"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onOpenTask(task);
        }}
      >
        <Maximize2 size={compact ? 9 : 10} />
      </button>

      {/* Top row: Checkbox + Inline-Editable Title */}
      <div
        className="flex items-start"
        style={{
          gap: compact ? '4px' : '6px',
          paddingLeft: compact ? '18px' : '22px'
        }}
      >
        {/* Completion Checkbox */}
        <button
          type="button"
          data-no-drag="true"
          data-testid={`task-checkbox-${task.id}`}
          className={`af-checkbox ${task.completed ? 'af-checkbox-checked' : ''}`}
          style={
            compact
              ? { width: '13px', height: '13px', borderRadius: '3px', marginTop: '1px' }
              : { width: '15px', height: '15px', marginTop: '1.5px' }
          }
          title={task.completed ? 'إلغاء إكمال المهمة' : 'تحديد المهمة كمكتملة'}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
        >
          {task.completed && <Check size={compact ? 9 : 11} strokeWidth={3} />}
        </button>

        {/* Inline Title Editing vs Clickable Title Line (cursor: text) */}
        {isEditingTitle ? (
          <input
            ref={inputRef}
            type="text"
            dir="auto"
            data-no-drag="true"
            data-testid={`task-inline-input-${task.id}`}
            value={draftTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftTitle(e.target.value)
            }
            onBlur={commitInlineTitle}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInlineTitle();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelInlineTitle();
              }
            }}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            className="af-inline-title-input flex-1 min-w-0"
            style={{
              fontSize: compact ? '0.68rem' : '0.78rem'
            }}
          />
        ) : (
          <div
            dir="auto"
            data-no-drag="true"
            data-testid={`task-title-${task.id}`}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              setDraftTitle(task.title);
              setIsEditingTitle(true);
            }}
            className={`af-editable-title flex-1 min-w-0 font-medium ${
              compact ? 'text-xs' : 'text-sm'
            } ${task.completed ? 'line-through text-muted' : 'text-primary'}`}
            style={
              compact
                ? {
                    fontSize: '0.68rem',
                    lineHeight: '1.22',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    overflowWrap: 'break-word'
                  }
                : {
                    fontSize: '0.78rem',
                    overflowWrap: 'break-word',
                    lineHeight: '1.38'
                  }
            }
            title="انقر لتعديل العنوان"
          >
            {task.title}
          </div>
        )}
      </div>

      {/* Metadata row: category tag, sub-step badge, completion percentage */}
      <div
        className="flex items-center justify-between"
        style={{
          gap: compact ? '3px' : '5px',
          minWidth: 0
        }}
      >
        {category ? (
          <span
            className="inline-flex items-center gap-1 rounded font-semibold"
            style={{
              fontSize: badgeFont,
              padding: badgePadding,
              minWidth: 0,
              flexShrink: 1,
              overflow: 'hidden',
              backgroundColor: hexToRgba(category.color, 0.16),
              color: category.color,
              border: `1px solid ${hexToRgba(category.color, 0.32)}`
            }}
            data-testid={`task-category-badge-${task.id}`}
          >
            <span
              style={{
                width: compact ? '4px' : '5px',
                height: compact ? '4px' : '5px',
                borderRadius: '2px',
                backgroundColor: category.color,
                display: 'inline-block',
                flexShrink: 0
              }}
            />
            <span dir="auto" className="truncate">{category.name}</span>
          </span>
        ) : (
          <span style={{ flex: 1 }} />
        )}

        <div className="flex items-center shrink-0" style={{ gap: compact ? '3px' : '4px' }}>
          {totalSteps > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded font-semibold"
              style={{
                fontSize: badgeFont,
                padding: badgePadding,
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                direction: 'ltr'
              }}
              data-testid={`task-steps-badge-${task.id}`}
              title={`الخطوات الفرعية: ${completedSteps} من ${totalSteps} مكتملة`}
            >
              <CheckSquare size={compact ? 8 : 10} />
              <span>
                {completedSteps}/{totalSteps}
              </span>
            </span>
          )}

          <span
            className="inline-flex items-center rounded font-bold"
            style={{
              fontSize: badgeFont,
              padding: badgePadding,
              backgroundColor: isFull ? 'var(--success-soft)' : 'var(--bg-subtle)',
              color: isFull ? 'var(--excel-bright)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              direction: 'ltr'
            }}
            data-testid={`task-percent-${task.id}`}
            title={`نسبة الإنجاز: ${progress}%`}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Excel-Green progress bar along the bottom edge */}
      <div className="af-task-progress-track" style={{ height: barHeight }}>
        <div
          className="af-task-progress-fill"
          style={{ width: `${progress}%` }}
          data-testid={`task-progress-fill-${task.id}`}
        />
      </div>
    </div>
  );
}
