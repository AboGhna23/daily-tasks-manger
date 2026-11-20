import type { Task, SaveSlotStats } from '../types/index.ts';

/** Completion percentage (0..100) for a task, derived from sub-steps when present. */
export function getTaskProgress(task: Task): number {
  const total = task.subSteps.length;
  if (total > 0) {
    const done = task.subSteps.filter((s) => s.completed).length;
    return Math.round((done / total) * 100);
  }
  return task.completed ? 100 : 0;
}

/**
 * Keeps the parent task in sync with its sub-steps:
 * all steps checked -> completed, any step unchecked -> not completed.
 * Tasks without sub-steps are left untouched.
 */
export function withAutoCompletion(task: Task): Task {
  // A failed task is never completed (failed and completed are mutually exclusive).
  if (task.failed) {
    return task.completed ? Object.assign({}, task, { completed: false }) : task;
  }
  const total = task.subSteps.length;
  if (total === 0) return task;
  const allDone = task.subSteps.every((s) => s.completed);
  if (task.completed === allDone) return task;
  return Object.assign({}, task, { completed: allDone });
}

/**
 * Toggles the main checkbox. With sub-steps, the whole checklist follows the parent
 * (check -> all steps done / uncheck -> all steps reset); without sub-steps it simply flips.
 */
export function toggleTaskCompletion(task: Task): Task {
  const next = !task.completed;
  // Completing a task always clears the failed flag.
  const failed = next ? false : task.failed;
  if (task.subSteps.length === 0) {
    return Object.assign({}, task, { completed: next, failed });
  }
  return Object.assign({}, task, {
    completed: next,
    failed,
    subSteps: task.subSteps.map((s) => Object.assign({}, s, { completed: next }))
  });
}

/** Computes aggregate completion stats for a Save Slot card. */
export function getSlotStats(tasks: Task[]): SaveSlotStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const unscheduledTasks = tasks.filter((t) => t.date === null).length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      unscheduledTasks: 0,
      progressPercent: 0
    };
  }
  const sumProgress = tasks.reduce((acc, t) => acc + getTaskProgress(t), 0);
  const progressPercent = Math.round(sumProgress / totalTasks);
  return {
    totalTasks,
    completedTasks,
    unscheduledTasks,
    progressPercent
  };
}

/** Toggles the failed state; marking as failed clears completion. */
export function toggleTaskFailed(task: Task): Task {
  const next = !task.failed;
  return Object.assign({}, task, { failed: next, completed: next ? false : task.completed });
}
