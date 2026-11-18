import React from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard.tsx';
import { ARABIC_WEEKDAYS, ARABIC_MONTHS } from '../utils/defaultData.ts';
import { HIJRI_MONTHS, formatDateLabel } from '../utils/dateSystems.ts';
import { getActiveDraggedTaskId, setActiveDraggedTaskId } from '../utils/dragState.ts';
import type {
  Task,
  Category,
  CalendarDayCell,
  DateMode,
  SidebarSide,
  DropTargetTask
} from '../types/index.ts';

export interface CalendarGridProps {
  sidebarSide: SidebarSide;
  dateMode: DateMode;
  days: CalendarDayCell[];
  tasks: Task[];
  categories: Category[];
  draggedTaskId: string | null;
  dragOverDayKey: string | null;
  onDragOverDay: (dateKey: string | null) => void;
  onDropTaskOnDay: (taskId: string, dateKey: string) => void;
  dropTargetTask: DropTargetTask | null;
  onToggleComplete: (taskId: string) => void;
  onRenameTask: (taskId: string, newTitle: string) => void;
  onOpenTask: (task: Task) => void;
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
  onDragOverTask: (targetTaskId: string, position: 'before' | 'after') => void;
  onDropOnTask: (draggedTaskId: string, targetTaskId: string, position: 'before' | 'after') => void;
  onPointerStartDrag?: (taskId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onCreateTaskOnDay: (dateKey: string, title: string) => void;
}

export function CalendarGrid({
  sidebarSide,
  dateMode,
  days,
  tasks,
  categories,
  draggedTaskId,
  dragOverDayKey,
  onDragOverDay,
  onDropTaskOnDay,
  dropTargetTask,
  onToggleComplete,
  onRenameTask,
  onOpenTask,
  onDragStartTask,
  onDragEndTask,
  onDragOverTask,
  onDropOnTask,
  onPointerStartDrag,
  onCreateTaskOnDay
}: CalendarGridProps) {
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  const tasksByDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.date) continue;
    const list = tasksByDate.get(t.date) || [];
    list.push(t);
    tasksByDate.set(t.date, list);
  }
  for (const [, list] of tasksByDate) {
    list.sort((a, b) => a.order - b.order);
  }

  const mainOrderClass =
    sidebarSide === 'right' ? 'af-main-when-sidebar-right' : 'af-main-when-sidebar-left';

  return (
    <main className={`af-main-calendar ${mainOrderClass}`} data-testid="calendar-main">
      <div className="af-calendar-scroll-inner">
        <div className="af-weekday-header">
          {ARABIC_WEEKDAYS.map((dayName) => (
            <div key={dayName} className="af-weekday-cell">
              {dayName}
            </div>
          ))}
        </div>

        <div className="af-calendar-grid" data-testid="calendar-grid">
          {days.map((cell) => {
            const dayTasks = tasksByDate.get(cell.dateKey) || [];
            const isDragOver = dragOverDayKey === cell.dateKey;
            const completedInDay = dayTasks.filter((t) => t.completed).length;

            const cellClasses = [
              'af-day-cell',
              !cell.isCurrentMonth ? 'af-day-cell-outside' : '',
              cell.isToday ? 'af-day-cell-today' : '',
              isDragOver ? 'af-day-cell-dragover' : ''
            ]
              .filter(Boolean)
              .join(' ');

            const primaryIsHijri = dateMode === 'hijri';
            const primaryNumber = primaryIsHijri ? cell.hijriDay : cell.dayNumber;
            const primaryMonthName = primaryIsHijri
              ? HIJRI_MONTHS[cell.hijriMonth - 1]
              : ARABIC_MONTHS[cell.dateObj.getMonth()];
            const primaryIsFirst = primaryIsHijri ? cell.hijriDay === 1 : cell.dayNumber === 1;

            const primaryColor = cell.isToday
              ? 'var(--text-primary)'
              : cell.isCurrentMonth
              ? 'var(--text-primary)'
              : 'var(--text-muted)';

            const dayTitle = formatDateLabel(cell.dateKey, dateMode);

            const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              const activeId = getActiveDraggedTaskId(e);
              if (!activeId) return;
              if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
              }
              if (dragOverDayKey !== cell.dateKey) {
                onDragOverDay(cell.dateKey);
              }
            };

            const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
              const related = e.relatedTarget as Node | null;
              if (related && e.currentTarget.contains(related)) return;
              if (dragOverDayKey === cell.dateKey) {
                onDragOverDay(null);
              }
            };

            const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              onDragOverDay(null);
              const activeId = getActiveDraggedTaskId(e);
              if (!activeId) return;
              onDropTaskOnDay(activeId, cell.dateKey);
              setActiveDraggedTaskId(null);
            };

            return (
              <div
                key={cell.dateKey}
                data-drop-day={cell.dateKey}
                data-is-today={cell.isToday ? 'true' : 'false'}
                data-testid={`day-cell-${cell.dateKey}`}
                className={cellClasses}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="af-day-head">
                  <div className="af-day-head-main" title={dayTitle}>
                    <span
                      className={`af-day-num ${cell.isToday ? 'af-day-num-today' : ''}`}
                      style={{
                        color: primaryColor,
                        fontWeight: cell.isToday ? 800 : 700
                      }}
                      data-testid={`day-primary-${cell.dateKey}`}
                    >
                      {primaryNumber}
                      {primaryIsFirst ? ` ${primaryMonthName}` : ''}
                    </span>

                    {dateMode === 'both' && (
                      <span
                        className="af-day-secondary"
                        data-testid={`day-hijri-${cell.dateKey}`}
                      >
                        {cell.hijriDay === 1
                          ? `${cell.hijriDay} ${HIJRI_MONTHS[cell.hijriMonth - 1]}`
                          : `${cell.hijriDay} هـ`}
                      </span>
                    )}
                  </div>

                  <div className="af-day-head-side">
                    {dayTasks.length > 0 && (
                      <span
                        className="af-day-count font-semibold px-1 rounded"
                        style={{
                          fontSize: '0.62rem',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-muted)',
                          direction: 'ltr'
                        }}
                      >
                        {completedInDay}/{dayTasks.length}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onCreateTaskOnDay(cell.dateKey, 'مهمة جديدة');
                      }}
                      className="af-icon-btn"
                      style={{ width: '19px', height: '19px', borderRadius: '4px' }}
                      title={`إضافة مهمة ليوم ${dayTitle}`}
                      data-testid={`add-to-day-${cell.dateKey}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="af-day-tasks-list" data-testid={`day-tasks-${cell.dateKey}`}>
                  {dayTasks.map((task) => {
                    const cat = task.categoryId ? categoryMap.get(task.categoryId) || null : null;
                    const indicator =
                      dropTargetTask && dropTargetTask.taskId === task.id
                        ? dropTargetTask.position
                        : null;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        category={cat}
                        isDragging={draggedTaskId === task.id}
                        dropIndicator={indicator}
                        onToggleComplete={onToggleComplete}
                        onRenameTask={onRenameTask}
                        onOpenTask={onOpenTask}
                        onDragStartTask={onDragStartTask}
                        onDragEndTask={onDragEndTask}
                        onDragOverTask={onDragOverTask}
                        onDropOnTask={onDropOnTask}
                        onPointerStartDrag={onPointerStartDrag}
                        compact={true}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
