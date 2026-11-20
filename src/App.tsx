import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { TaskSidebar } from './components/TaskSidebar.tsx';
import { CalendarGrid } from './components/CalendarGrid.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { CategoryModal } from './components/CategoryModal.tsx';
import { SaveSlotsScreen } from './components/SaveSlotsScreen.tsx';
import { formatDateKey } from './utils/defaultData.ts';
import { buildMonthView, shiftViewMonth } from './utils/dateSystems.ts';
import { toggleTaskCompletion } from './utils/progress.ts';
import { setActiveDraggedTaskId } from './utils/dragState.ts';
import { useSaveSlots } from './hooks/useSaveSlots.ts';
import type {
  Task,
  Category,
  SidebarPosition,
  SidebarSide,
  ThemeMode,
  DropTargetTask
} from './types/index.ts';

const THEME_STORAGE_KEY = 'af_excel_theme_v1';

function loadTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw) as string;
    return parsed === 'light' || parsed === 'dark' ? parsed : 'dark';
  } catch {
    return 'dark';
  }
}

function noonOf(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

export function App() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const {
    slots,
    slotDataMap,
    activeSlotMeta,
    activeSlotData,
    openSlot,
    returnToSlotsScreen,
    createSlot,
    renameSlot,
    resetSlot,
    deleteSlot,
    updateActiveSlotTasks,
    updateActiveSlotCategories,
    updateActiveSlotSidebar,
    updateActiveSlotDateMode
  } = useSaveSlots(today);

  const [theme, setTheme] = useState(() => loadTheme());
  const [viewAnchor, setViewAnchor] = useState(() => noonOf(today));
  const [lastSidebarSide, setLastSidebarSide] = useState('right' as SidebarSide);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(
    null as string | null
  );
  const [activeTaskId, setActiveTaskId] = useState(null as string | null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false as boolean);

  // Drag & drop UI state
  const [draggedTaskId, setDraggedTaskId] = useState(null as string | null);
  const [dragOverDayKey, setDragOverDayKey] = useState(null as string | null);
  const [isSidebarDragOver, setIsSidebarDragOver] = useState(false as boolean);
  const [dropTargetTask, setDropTargetTask] = useState(null as DropTargetTask | null);
  const [suppressClickUntil, setSuppressClickUntil] = useState(0 as number);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // ignore
    }
    const rootEl = document.documentElement;
    if (theme === 'dark') {
      rootEl.classList.add('dark');
      rootEl.setAttribute('data-theme', 'dark');
    } else {
      rootEl.classList.remove('dark');
      rootEl.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const tasks = activeSlotData ? activeSlotData.tasks : [];
  const categories = activeSlotData ? activeSlotData.categories : [];
  const sidebarPosition = activeSlotData ? activeSlotData.sidebarPosition : 'right';
  const dateMode = activeSlotData ? activeSlotData.dateMode : 'both';

  useEffect(() => {
    if (sidebarPosition === 'right' || sidebarPosition === 'left') {
      setLastSidebarSide(sidebarPosition);
    }
  }, [sidebarPosition]);

  const monthView = useMemo(
    () => buildMonthView(viewAnchor, dateMode, todayKey),
    [viewAnchor, dateMode, todayKey]
  );

  const unscheduledTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === null)
        .slice()
        .sort((a, b) => a.order - b.order),
    [tasks]
  );

  const activeTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) || null : null),
    [tasks, activeTaskId]
  );

  const sidebarSide: SidebarSide =
    sidebarPosition === 'hidden' ? lastSidebarSide : sidebarPosition;

  const handlePrevMonth = () => setViewAnchor(shiftViewMonth(viewAnchor, dateMode, -1));
  const handleNextMonth = () => setViewAnchor(shiftViewMonth(viewAnchor, dateMode, 1));
  const handleGoToday = () => setViewAnchor(noonOf(new Date()));

  const handleChangeSidebarPosition = (position: SidebarPosition) => {
    updateActiveSlotSidebar(position);
    if (position !== 'hidden') setLastSidebarSide(position);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const newId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const handleQuickAddTask = (title: string, categoryId: string | null) => {
    const newTask: Task = {
      id: newId('task'),
      title,
      categoryId,
      date: null,
      completed: false,
      order: unscheduledTasks.length,
      subSteps: [],
      createdAt: new Date().toISOString()
    };
    updateActiveSlotTasks((prev) => [...prev, newTask]);
  };

  // Direct inline task creation on a day cell (does NOT open the modal)
  const handleCreateTaskOnDay = (dateKey: string, title: string) => {
    const dayTasksCount = tasks.filter((t) => t.date === dateKey).length;
    const newTask: Task = {
      id: newId('task'),
      title: title.trim() || 'مهمة جديدة',
      categoryId: categories[0]?.id || null,
      date: dateKey,
      completed: false,
      order: dayTasksCount,
      subSteps: [],
      createdAt: new Date().toISOString()
    };
    updateActiveSlotTasks((prev) => [...prev, newTask]);
  };

  // Duplicates a task (title, category, sub-steps with fresh IDs) into the unscheduled sidebar list
  const handleDuplicateTask = (source: Task) => {
    const copy: Task = {
      id: newId('task'),
      title: source.title,
      categoryId: source.categoryId,
      date: null,
      completed: false,
      failed: false,
      order: unscheduledTasks.length,
      subSteps: source.subSteps.map((s) => ({
        id: newId('step'),
        text: s.text,
        completed: false
      })),
      createdAt: new Date().toISOString()
    };
    updateActiveSlotTasks((prev) => [...prev, copy]);
  };

  const handleRenameTask = (taskId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    updateActiveSlotTasks((prev) =>
      prev.map((t) => (t.id === taskId ? Object.assign({}, t, { title: trimmed }) : t))
    );
  };

  const handleToggleComplete = (taskId: string) => {
    updateActiveSlotTasks((prev) =>
      prev.map((t) => (t.id === taskId ? toggleTaskCompletion(t) : t))
    );
  };

  const handleUpdateTask = (updated: Task) => {
    updateActiveSlotTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    updateActiveSlotTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const resetDragState = () => {
    setDraggedTaskId(null);
    setDragOverDayKey(null);
    setIsSidebarDragOver(false);
    setDropTargetTask(null);
    setActiveDraggedTaskId(null);
  };

  const moveTaskToBucket = (taskId: string, targetDate: string | null) => {
    updateActiveSlotTasks((prev) => {
      const targetTask = prev.find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const bucketTasks = prev
        .filter((t) => t.date === targetDate && t.id !== taskId)
        .sort((a, b) => a.order - b.order);

      const nextOrder = bucketTasks.length;
      return prev.map((t) => {
        if (t.id === taskId) {
          return Object.assign({}, t, { date: targetDate, order: nextOrder });
        }
        const idx = bucketTasks.findIndex((b) => b.id === t.id);
        if (idx !== -1) {
          return Object.assign({}, t, { order: idx });
        }
        return t;
      });
    });
    resetDragState();
  };

  const handleDropOnTask = (
    draggedId: string,
    targetId: string,
    position: 'before' | 'after'
  ) => {
    if (draggedId === targetId) {
      resetDragState();
      return;
    }
    updateActiveSlotTasks((prev) => {
      const dragged = prev.find((t) => t.id === draggedId);
      const target = prev.find((t) => t.id === targetId);
      if (!dragged || !target) return prev;

      const destDate = target.date;
      const destSiblings = prev
        .filter((t) => t.date === destDate && t.id !== draggedId)
        .sort((a, b) => a.order - b.order);

      const targetIdx = destSiblings.findIndex((t) => t.id === targetId);
      const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;

      const updatedDragged = Object.assign({}, dragged, { date: destDate });
      destSiblings.splice(Math.max(0, insertIdx), 0, updatedDragged);

      const orderMap = new Map<string, { date: string | null; order: number }>();
      destSiblings.forEach((item, idx) => {
        orderMap.set(item.id, { date: destDate, order: idx });
      });

      return prev.map((t) => {
        const info = orderMap.get(t.id);
        if (info) {
          return Object.assign({}, t, { date: info.date, order: info.order });
        }
        return t;
      });
    });
    resetDragState();
  };

  const handlePointerStartDrag = (
    taskId: string,
    startEvent: React.MouseEvent<HTMLDivElement>
  ) => {
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    let pointerDragging = false;
    let nativeDragStarted = false;

    const onNativeDragStart = () => {
      nativeDragStarted = true;
      cleanup();
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (nativeDragStarted) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!pointerDragging && Math.hypot(dx, dy) > 6) {
        pointerDragging = true;
        setActiveDraggedTaskId(taskId);
        setDraggedTaskId(taskId);
      }
      if (!pointerDragging) return;

      const el = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      ) as HTMLElement | null;
      if (!el) return;

      const sidebarEl = el.closest('[data-drop-sidebar]') as HTMLElement | null;
      if (sidebarEl) {
        setIsSidebarDragOver(true);
        setDragOverDayKey(null);
        setDropTargetTask(null);
        return;
      }
      setIsSidebarDragOver(false);

      const taskEl = el.closest('[data-task-id]') as HTMLElement | null;
      const overTaskId = taskEl ? taskEl.getAttribute('data-task-id') : null;
      if (overTaskId && overTaskId !== taskId && taskEl) {
        const rect = taskEl.getBoundingClientRect();
        const pos: 'before' | 'after' =
          moveEvent.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        setDropTargetTask({ taskId: overTaskId, position: pos });
      } else {
        setDropTargetTask(null);
      }

      const dayEl = el.closest('[data-drop-day]') as HTMLElement | null;
      setDragOverDayKey(dayEl ? dayEl.getAttribute('data-drop-day') : null);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (pointerDragging && !nativeDragStarted) {
        setSuppressClickUntil(Date.now() + 250);
        const el = document.elementFromPoint(
          upEvent.clientX,
          upEvent.clientY
        ) as HTMLElement | null;
        if (el) {
          const sidebarEl = el.closest('[data-drop-sidebar]') as HTMLElement | null;
          if (sidebarEl) {
            moveTaskToBucket(taskId, null);
            cleanup();
            return;
          }

          const taskEl = el.closest('[data-task-id]') as HTMLElement | null;
          const overTaskId = taskEl ? taskEl.getAttribute('data-task-id') : null;
          if (overTaskId && overTaskId !== taskId && taskEl) {
            const rect = taskEl.getBoundingClientRect();
            const pos: 'before' | 'after' =
              upEvent.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
            handleDropOnTask(taskId, overTaskId, pos);
            cleanup();
            return;
          }

          const dayEl = el.closest('[data-drop-day]') as HTMLElement | null;
          const dayKey = dayEl ? dayEl.getAttribute('data-drop-day') : null;
          if (dayKey) {
            moveTaskToBucket(taskId, dayKey);
            cleanup();
            return;
          }
        }
        resetDragState();
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('dragstart', onNativeDragStart, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
    };

    window.addEventListener('dragstart', onNativeDragStart, true);
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
  };

  const handleAddCategory = (name: string, color: string) => {
    const created: Category = { id: newId('cat'), name, color };
    updateActiveSlotCategories((prev) => [...prev, created]);
  };

  const handleUpdateCategory = (id: string, name: string, color: string) => {
    updateActiveSlotCategories((prev) =>
      prev.map((c) => (c.id === id ? { id, name, color } : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    updateActiveSlotCategories((prev) => prev.filter((c) => c.id !== id));
    updateActiveSlotTasks((prev) =>
      prev.map((t) => (t.categoryId === id ? Object.assign({}, t, { categoryId: null }) : t))
    );
    if (selectedCategoryFilter === id) {
      setSelectedCategoryFilter(null);
    }
  };

  const handleOpenTaskCard = (task: Task) => {
    if (Date.now() < suppressClickUntil) return;
    setActiveTaskId(task.id);
  };

  return (
    <div className="af-viewport" data-theme={theme} data-testid="app-viewport">
      <div className="af-app-frame af-app-shell" data-theme={theme} data-testid="app-frame">
        {!activeSlotMeta || !activeSlotData ? (
          <SaveSlotsScreen
            slots={slots}
            slotDataMap={slotDataMap}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSlot={(slotId) => {
              setSelectedCategoryFilter(null);
              setActiveTaskId(null);
              openSlot(slotId);
            }}
            onCreateSlot={(title, color) => {
              createSlot(title, color);
            }}
            onRenameSlot={renameSlot}
            onResetSlot={resetSlot}
            onDeleteSlot={deleteSlot}
          />
        ) : (
          <>
            <Header
              slotTitle={activeSlotMeta.title}
              slotColor={activeSlotMeta.color}
              onBackToSlots={() => {
                setActiveTaskId(null);
                setIsCategoryModalOpen(false);
                returnToSlotsScreen();
              }}
              primaryLabel={monthView.primaryLabel}
              secondaryLabel={monthView.secondaryLabel}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onGoToday={handleGoToday}
              sidebarPosition={sidebarPosition}
              onChangeSidebarPosition={handleChangeSidebarPosition}
              dateMode={dateMode}
              onChangeDateMode={updateActiveSlotDateMode}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              categories={categories}
              onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            />

            <div
              className="af-workspace-container"
              data-sidebar-position={sidebarPosition}
              data-testid="workspace-container"
            >
              <TaskSidebar
                sidebarPosition={sidebarPosition}
                sidebarSide={sidebarSide}
                unscheduledTasks={unscheduledTasks}
                categories={categories}
                selectedCategoryFilter={selectedCategoryFilter}
                onSelectCategoryFilter={setSelectedCategoryFilter}
                onQuickAddTask={handleQuickAddTask}
                onToggleComplete={handleToggleComplete}
                onRenameTask={handleRenameTask}
                onOpenTask={handleOpenTaskCard}
                draggedTaskId={draggedTaskId}
                isSidebarDragOver={isSidebarDragOver}
                onSidebarDragOver={(isOver) => {
                  setIsSidebarDragOver(isOver);
                  if (isOver) {
                    setDragOverDayKey(null);
                    setDropTargetTask(null);
                  }
                }}
                onDropTaskToSidebar={(taskId) => moveTaskToBucket(taskId, null)}
                onDragStartTask={(id) => setDraggedTaskId(id)}
                onDragEndTask={resetDragState}
                onPointerStartDrag={handlePointerStartDrag}
              />

              <CalendarGrid
                sidebarSide={sidebarSide}
                dateMode={dateMode}
                days={monthView.cells}
                tasks={tasks}
                categories={categories}
                draggedTaskId={draggedTaskId}
                dragOverDayKey={dragOverDayKey}
                onDragOverDay={(dateKey) => {
                  setDragOverDayKey(dateKey);
                  if (dateKey) setIsSidebarDragOver(false);
                }}
                onDropTaskOnDay={(taskId, dateKey) => moveTaskToBucket(taskId, dateKey)}
                dropTargetTask={dropTargetTask}
                onToggleComplete={handleToggleComplete}
                onRenameTask={handleRenameTask}
                onOpenTask={handleOpenTaskCard}
                onDragStartTask={(id) => setDraggedTaskId(id)}
                onDragEndTask={resetDragState}
                onDragOverTask={(targetId, pos) =>
                  setDropTargetTask({ taskId: targetId, position: pos })
                }
                onDropOnTask={handleDropOnTask}
                onPointerStartDrag={handlePointerStartDrag}
                onCreateTaskOnDay={handleCreateTaskOnDay}
              />
            </div>

            {activeTask && (
              <TaskDetailModal
                task={activeTask}
                categories={categories}
                dateMode={dateMode}
                onClose={() => setActiveTaskId(null)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onMoveToSidebar={(taskId) => moveTaskToBucket(taskId, null)}
                onDuplicateTask={handleDuplicateTask}
              />
            )}

            {isCategoryModalOpen && (
              <CategoryModal
                categories={categories}
                onClose={() => setIsCategoryModalOpen(false)}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
