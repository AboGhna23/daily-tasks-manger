import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Tag,
  Calendar,
  CornerUpLeft,
  ArrowUp,
  ArrowDown,
  CheckSquare
} from 'lucide-react';
import { hexToRgba } from '../utils/defaultData.ts';
import { formatDateLabel } from '../utils/dateSystems.ts';
import { getTaskProgress, toggleTaskCompletion } from '../utils/progress.ts';
import type { Task, Category, SubStep, DateMode } from '../types/index.ts';

export interface TaskDetailModalProps {
  task: Task;
  categories: Category[];
  dateMode: DateMode;
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveToSidebar: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  categories,
  dateMode,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onMoveToSidebar
}: TaskDetailModalProps) {
  const [newStepText, setNewStepText] = useState('' as string);

  const totalSteps = task.subSteps.length;
  const completedSteps = task.subSteps.filter((s) => s.completed).length;
  const progressPercent = getTaskProgress(task);

  const handleTitleChange = (val: string) => {
    onUpdateTask(Object.assign({}, task, { title: val }));
  };

  const handleToggleMainCompleted = () => {
    onUpdateTask(toggleTaskCompletion(task));
  };

  const handleSelectCategory = (categoryId: string | null) => {
    onUpdateTask(Object.assign({}, task, { categoryId }));
  };

  const handleAddSubStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newStepText.trim();
    const stepText = trimmed || `خطوة ${task.subSteps.length + 1}`;
    const newStep: SubStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: stepText,
      completed: false
    };
    onUpdateTask(
      Object.assign({}, task, {
        subSteps: [...task.subSteps, newStep]
      })
    );
    setNewStepText('');
  };

  const handleToggleSubStep = (stepId: string) => {
    const updatedSteps = task.subSteps.map((s) =>
      s.id === stepId ? Object.assign({}, s, { completed: !s.completed }) : s
    );
    onUpdateTask(Object.assign({}, task, { subSteps: updatedSteps }));
  };

  const handleEditSubStepText = (stepId: string, text: string) => {
    const updatedSteps = task.subSteps.map((s) =>
      s.id === stepId ? Object.assign({}, s, { text }) : s
    );
    onUpdateTask(Object.assign({}, task, { subSteps: updatedSteps }));
  };

  const handleDeleteSubStep = (stepId: string) => {
    const updatedSteps = task.subSteps.filter((s) => s.id !== stepId);
    onUpdateTask(Object.assign({}, task, { subSteps: updatedSteps }));
  };

  const handleMoveSubStep = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= task.subSteps.length) return;
    const copy = task.subSteps.slice();
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onUpdateTask(Object.assign({}, task, { subSteps: copy }));
  };

  return (
    <div
      className="af-modal-backdrop"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="task-detail-modal"
    >
      <div
        className="af-modal-panel"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 border-b-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMainCompleted}
              className={`af-checkbox ${task.completed ? 'af-checkbox-checked' : ''}`}
              style={{ width: '18px', height: '18px' }}
              data-testid="modal-task-complete-checkbox"
            >
              {task.completed && <Check size={13} strokeWidth={3} />}
            </button>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-subtle text-secondary">
              {task.completed ? 'مهمة مكتملة' : 'قيد التنفيذ'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="af-icon-btn"
            title="إغلاق"
            data-testid="close-task-modal-btn"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3.5">
          {/* Task Title Input */}
          <div>
            <label className="text-xs font-bold text-secondary mb-1 block">
              عنوان المهمة
            </label>
            <input
              type="text"
              dir="auto"
              value={task.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleTitleChange(e.target.value)
              }
              className="af-input font-bold text-sm"
              placeholder="عنوان المهمة..."
              data-testid="modal-task-title-input"
            />
          </div>

          {/* Scheduled Day Info */}
          <div
            className="p-2.5 rounded flex items-center justify-between gap-2"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <Calendar size={14} color="var(--excel-bright)" />
              <span className="text-primary font-bold">
                {formatDateLabel(task.date, dateMode)}
              </span>
            </div>

            {task.date !== null && (
              <button
                type="button"
                onClick={() => {
                  onMoveToSidebar(task.id);
                  onClose();
                }}
                className="af-btn text-xs"
                style={{ padding: '3px 8px' }}
                data-testid="move-to-sidebar-btn"
              >
                <CornerUpLeft size={12} />
                <span>نقل للقائمة الجانبية</span>
              </button>
            )}
          </div>

          {/* Category Assignment */}
          <div>
            <label className="text-xs font-bold text-secondary mb-1.5 flex items-center gap-1.5">
              <Tag size={12} />
              <span>التصنيف</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                className="af-pill"
                style={
                  task.categoryId === null
                    ? {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        borderColor: 'var(--accent-primary)'
                      }
                    : {}
                }
                data-testid="modal-cat-none"
              >
                بدون تصنيف
              </button>

              {categories.map((cat) => {
                const isSelected = task.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className="af-pill"
                    style={{
                      backgroundColor: isSelected
                        ? cat.color
                        : hexToRgba(cat.color, 0.14),
                      color: isSelected ? '#ffffff' : cat.color,
                      borderColor: isSelected
                        ? cat.color
                        : hexToRgba(cat.color, 0.35)
                    }}
                    data-testid={`modal-cat-${cat.id}`}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '2px',
                        backgroundColor: isSelected ? '#ffffff' : cat.color,
                        display: 'inline-block'
                      }}
                    />
                    <span dir="auto">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actionable Sub-Steps (Checklist) Section */}
          <div
            className="p-3 rounded flex flex-col gap-2.5"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CheckSquare size={14} color="var(--excel-bright)" />
                <span>الخطوات الفرعية</span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  direction: 'ltr'
                }}
                data-testid="modal-steps-counter"
              >
                {completedSteps}/{totalSteps} ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'var(--progress-track)',
                overflow: 'hidden',
                direction: 'rtl'
              }}
            >
              <div
                data-testid="modal-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: 'var(--progress-fill)',
                  transition: 'width 180ms ease-out'
                }}
              />
            </div>

            {/* Add New Sub-Step Input (allows empty submit -> خطوة 1, خطوة 2, ...) */}
            <form
              onSubmit={handleAddSubStep}
              className="flex items-center gap-1.5"
              data-testid="add-substep-form"
            >
              <input
                type="text"
                dir="auto"
                value={newStepText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewStepText(e.target.value)
                }
                placeholder={`خطوة ${task.subSteps.length + 1} (اختياري)...`}
                className="af-input text-xs"
                data-testid="add-substep-input"
              />
              <button
                type="submit"
                className="af-btn af-btn-primary shrink-0"
                data-testid="add-substep-btn"
              >
                <Plus size={14} />
                <span>إضافة خطوة</span>
              </button>
            </form>

            {/* Sub-Steps List (no filler text when empty) */}
            {task.subSteps.length > 0 && (
              <div className="flex flex-col gap-1.5" data-testid="substeps-list">
                {task.subSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-2 rounded bg-surface border-subtle"
                    data-testid={`substep-item-${step.id}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubStep(step.id)}
                      className={`af-checkbox ${
                        step.completed ? 'af-checkbox-checked' : ''
                      }`}
                      data-testid={`substep-checkbox-${step.id}`}
                    >
                      {step.completed && <Check size={11} strokeWidth={3} />}
                    </button>

                    <input
                      type="text"
                      dir="auto"
                      value={step.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleEditSubStepText(step.id, e.target.value)
                      }
                      className={`flex-1 min-w-0 text-xs bg-surface ${
                        step.completed ? 'line-through text-muted' : 'text-primary'
                      }`}
                      style={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent'
                      }}
                      data-testid={`substep-input-${step.id}`}
                    />

                    {/* Reorder Up/Down & Delete Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSubStep(index, -1)}
                        disabled={index === 0}
                        className="af-icon-btn"
                        style={{
                          width: '22px',
                          height: '22px',
                          opacity: index === 0 ? 0.3 : 1
                        }}
                        title="تحريك لأعلى"
                        data-testid={`substep-up-${step.id}`}
                      >
                        <ArrowUp size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveSubStep(index, 1)}
                        disabled={index === task.subSteps.length - 1}
                        className="af-icon-btn"
                        style={{
                          width: '22px',
                          height: '22px',
                          opacity: index === task.subSteps.length - 1 ? 0.3 : 1
                        }}
                        title="تحريك لأسفل"
                        data-testid={`substep-down-${step.id}`}
                      >
                        <ArrowDown size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubStep(step.id)}
                        className="af-icon-btn"
                        style={{
                          width: '22px',
                          height: '22px',
                          color: 'var(--danger)'
                        }}
                        title="حذف الخطوة"
                        data-testid={`substep-delete-${step.id}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t-subtle flex items-center justify-between bg-subtle">
          <button
            type="button"
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="af-btn af-btn-danger"
            data-testid="delete-task-btn"
          >
            <Trash2 size={14} />
            <span>حذف المهمة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="af-btn af-btn-primary"
            data-testid="done-task-modal-btn"
          >
            <Check size={14} />
            <span>تم الحفظ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
