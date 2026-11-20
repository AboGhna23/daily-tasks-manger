export interface SubStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string | null;
  /** YYYY-MM-DD calendar day string, or null when unscheduled in the sidebar */
  date: string | null;
  completed: boolean;
  /** Optional: task marked as failed (mutually exclusive with completed) */
  failed?: boolean;
  order: number;
  subSteps: SubStep[];
  createdAt: string;
}

export type SidebarPosition = 'right' | 'left' | 'hidden';
export type SidebarSide = 'right' | 'left';
export type ThemeMode = 'light' | 'dark';
export type DateMode = 'both' | 'gregorian' | 'hijri';

export interface CalendarDayCell {
  dateKey: string;
  /** Gregorian day of month */
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateObj: Date;
  hijriDay: number;
  /** 1..12 */
  hijriMonth: number;
  hijriYear: number;
}

export interface MonthView {
  cells: CalendarDayCell[];
  primaryLabel: string;
  secondaryLabel: string | null;
}

export interface DropTargetTask {
  taskId: string;
  position: 'before' | 'after';
}

export interface SaveSlotMeta {
  id: string;
  slotNumber: number;
  title: string;
  color: string;
  updatedAt: string;
}

export interface SaveSlotData {
  tasks: Task[];
  categories: Category[];
  sidebarPosition: SidebarPosition;
  dateMode: DateMode;
  updatedAt: string;
}

export interface SaveSlotStats {
  totalTasks: number;
  completedTasks: number;
  unscheduledTasks: number;
  progressPercent: number;
}
