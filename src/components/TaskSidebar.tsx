import React, { useState } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { TaskCard } from './TaskCard.tsx';
import { hexToRgba } from '../utils/defaultData.ts';
import { getActiveDraggedTaskId, setActiveDraggedTaskId } from '../utils/dragState.ts';
import type { Task, Category, SidebarPosition, SidebarSide } from '../types/index.ts';

export interface TaskSidebarProps {
  sidebarPosition: SidebarPosition;
  sidebarSide: SidebarSide;
  unscheduledTasks: Task[];
  categories: Category[];
  selectedCategoryFilter: string | null;
  onSelectCategoryFilter: (categoryId: string | null) => void;
  onQuickAddTask: (title: string, categoryId: string | null) => void;
  onToggleComplete: (taskId: string) => void;
  onRenameTask: (taskId: string, newTitle: string) => void;
  onOpenTask: (task: Task) => void;
  draggedTaskId: string | null;
  isSidebarDragOver: boolean;
  onSidebarDragOver: (isOver: boolean) => void;
  onDropTaskToSidebar: (taskId: string) => void;
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
  onPointerStartDrag?: (taskId: string, e: React.MouseEvent<HTMLDivElement>) => void;
}

export function TaskSidebar({
  sidebarPosition,
  sidebarSide,
  unscheduledTasks,
  categories,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onQuickAddTask,
  onToggleComplete,
  onRenameTask,
  onOpenTask,
  draggedTaskId,
  isSidebarDragOver,
  onSidebarDragOver,
  onDropTaskToSidebar,
  onDragStartTask,
  onDragEndTask,
  onPointerStartDrag
}: TaskSidebarProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('' as string);
  const [quickCategoryId, setQuickCategoryId] = useState(
    (categories[0]?.id || null) as string | null
  );

  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  const filteredTasks = selectedCategoryFilter
    ? unscheduledTasks.filter((t) => t.categoryId === selectedCategoryFilter)
    : unscheduledTasks;

  const effectiveQuickCategoryId =
    quickCategoryId && categoryMap.has(quickCategoryId) ? quickCategoryId : null;

  const handleQuickAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const titleToUse = newTaskTitle.trim() || 'مهمة جديدة';
    onQuickAddTask(titleToUse, effectiveQuickCategoryId);
    setNewTaskTitle('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const activeId = getActiveDraggedTaskId(e);
    if (!activeId) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (!isSidebarDragOver) {
      onSidebarDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    onSidebarDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    onSidebarDragOver(false);
    const activeId = getActiveDraggedTaskId(e);
    if (!activeId) return;
    onDropTaskToSidebar(activeId);
    setActiveDraggedTaskId(null);
  };

  const isHidden = sidebarPosition === 'hidden';
  const sidebarPosClass = sidebarSide === 'right' ? 'af-sidebar-right' : 'af-sidebar-left';

  return (
    <aside
      data-drop-sidebar="true"
      data-sidebar-position={sidebarPosition}
      data-testid="task-sidebar"
      aria-hidden={isHidden ? 'true' : 'false'}
      className={`af-sidebar ${sidebarPosClass} ${isHidden ? 'af-sidebar-hidden' : ''} ${
        isSidebarDragOver ? 'af-sidebar-dragover' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="af-sidebar-inner">
        {/* Sidebar Top Bar: Icon + Counter Badge Only (no text) */}
        <div
          className="px-3 py-1.5 border-b-subtle flex items-center justify-between shrink-0"
          data-testid="sidebar-top-bar"
        >
          <ListTodo size={16} color="var(--excel-bright)" />
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.68rem'
            }}
            data-testid="unscheduled-count-badge"
          >
            {unscheduledTasks.length}
          </span>
        </div>

        {/* Quick-Add Input Bar */}
        <form
          onSubmit={handleQuickAddSubmit}
          className="p-2.5 border-b-subtle flex flex-col gap-2"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
          data-testid="quick-add-form"
        >
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              dir="auto"
              value={newTaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTaskTitle(e.target.value)
              }
              placeholder="إضافة مهمة..."
              className="af-input text-xs"
              style={{ padding: '6px 10px' }}
              data-testid="quick-add-input"
            />
            <button
              type="submit"
              className="af-btn af-btn-primary shrink-0"
              style={{ height: '31px', padding: '0 10px' }}
              title="إضافة المهمة إلى القائمة"
              data-testid="quick-add-submit-btn"
            >
              <Plus size={14} />
              <span>إضافة</span>
            </button>
          </div>

          {/* Category Selector on Creation */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setQuickCategoryId(null)}
              className="rounded font-medium"
              style={{
                fontSize: '0.66rem',
                padding: '1.5px 6px',
                backgroundColor:
                  effectiveQuickCategoryId === null ? 'var(--bg-active)' : 'var(--bg-surface)',
                color:
                  effectiveQuickCategoryId === null ? 'var(--text-primary)' : 'var(--text-secondary)',
                border:
                  effectiveQuickCategoryId === null
                    ? '1px solid var(--border-strong)'
                    : '1px solid var(--border-subtle)'
              }}
            >
              بدون
            </button>
            {categories.map((cat) => {
              const isSelected = effectiveQuickCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setQuickCategoryId(cat.id)}
                  className="inline-flex items-center gap-1 rounded font-semibold"
                  style={{
                    fontSize: '0.66rem',
                    padding: '1.5px 6px',
                    backgroundColor: isSelected
                      ? hexToRgba(cat.color, 0.22)
                      : 'var(--bg-surface)',
                    color: isSelected ? cat.color : 'var(--text-secondary)',
                    border: isSelected
                      ? `1.5px solid ${cat.color}`
                      : '1px solid var(--border-subtle)'
                  }}
                  data-testid={`quick-add-cat-${cat.id}`}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '2px',
                      backgroundColor: cat.color,
                      display: 'inline-block'
                    }}
                  />
                  <span dir="auto">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </form>

        {/* Category Filter Bar */}
        <div
          className="px-2.5 py-1.5 border-b-subtle flex items-center gap-1 overflow-x-auto shrink-0"
          data-testid="sidebar-category-filters"
        >
          <button
            type="button"
            onClick={() => onSelectCategoryFilter(null)}
            className={`af-pill ${selectedCategoryFilter === null ? 'af-pill-active' : ''}`}
            data-testid="filter-pill-all"
          >
            <span>الكل</span>
            <span style={{ opacity: 0.8 }}>({unscheduledTasks.length})</span>
          </button>

          {categories.map((cat) => {
            const count = unscheduledTasks.filter((t) => t.categoryId === cat.id).length;
            const isActive = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategoryFilter(isActive ? null : cat.id)}
                className="af-pill"
                style={
                  isActive
                    ? {
                        backgroundColor: cat.color,
                        color: '#ffffff',
                        borderColor: cat.color
                      }
                    : {}
                }
                data-testid={`filter-pill-${cat.id}`}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '2px',
                    backgroundColor: isActive ? '#ffffff' : cat.color,
                    display: 'inline-block'
                  }}
                />
                <span dir="auto">{cat.name}</span>
                <span style={{ opacity: 0.75 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Unscheduled Task Pool List (static droppable container; no sortable drop indicators) */}
        <div
          className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2"
          data-testid="unscheduled-tasks-list"
        >
          {filteredTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted" data-testid="sidebar-empty-label">
              لا توجد مهام
            </div>
          ) : (
            filteredTasks.map((task) => {
              const cat = task.categoryId ? categoryMap.get(task.categoryId) || null : null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  category={cat}
                  isDragging={draggedTaskId === task.id}
                  dropIndicator={null}
                  disableCardDropTarget={true}
                  onToggleComplete={onToggleComplete}
                  onRenameTask={onRenameTask}
                  onOpenTask={onOpenTask}
                  onDragStartTask={onDragStartTask}
                  onDragEndTask={onDragEndTask}
                  onDragOverTask={() => {}}
                  onDropOnTask={() => {}}
                  onPointerStartDrag={onPointerStartDrag}
                />
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
