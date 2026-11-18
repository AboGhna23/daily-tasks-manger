import type { Category, Task, SaveSlotMeta, SaveSlotData } from '../types/index.ts';

export const ARABIC_MONTHS: string[] = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

export const ARABIC_WEEKDAYS: string[] = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

export interface PaletteColor {
  hex: string;
  label: string;
}

export const COLOR_PALETTE: PaletteColor[] = [
  { hex: '#217346', label: 'أخضر إكسل' },
  { hex: '#28a745', label: 'زمردي ساطع' },
  { hex: '#0ea5e9', label: 'سماوي' },
  { hex: '#f59e0b', label: 'كهرماني' },
  { hex: '#e11d48', label: 'وردي ياقوتي' },
  { hex: '#14b8a6', label: 'فيروزي' },
  { hex: '#f97316', label: 'برتقالي' },
  { hex: '#84cc16', label: 'أخضر ليموني' },
  { hex: '#3b82f6', label: 'أزرق ملكي' },
  { hex: '#ec4899', label: 'أرجواني' },
  { hex: '#a855f7', label: 'بنفسجي' },
  { hex: '#64748b', label: 'رمادي معدني' }
];

/** Rocket League-style 2D Color Swatch Matrix (7 rows × 12 columns = 84 colors) */
export const COLOR_MATRIX_ROWS: string[][] = [
  ['#f1f5f9', '#fca5a5', '#fdba74', '#fcd34d', '#fde047', '#bef264', '#86efac', '#5eead4', '#7dd3fc', '#93c5fd', '#c4b5fd', '#f9a8d4'],
  ['#cbd5e1', '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#60a5fa', '#a78bfa', '#f472b6'],
  ['#94a3b8', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#28a745', '#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'],
  ['#64748b', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#217346', '#0d9488', '#0284c7', '#2563eb', '#7c3aed', '#db2777'],
  ['#475569', '#b91c1c', '#c2410c', '#b45309', '#a16207', '#4d7c0f', '#166534', '#0f766e', '#0369a1', '#1d4ed8', '#6d28d9', '#be185d'],
  ['#334155', '#991b1b', '#9a3412', '#92400e', '#854d0e', '#3f6212', '#14532d', '#115e59', '#075985', '#1e40af', '#5b21b6', '#9d174d'],
  ['#1e293b', '#7f1d1d', '#7c2d12', '#78350f', '#713f12', '#365314', '#052e16', '#134e4a', '#0c4a6e', '#1e3a8a', '#4c1d95', '#831843']
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'العمل', color: '#217346' },
  { id: 'cat-study', name: 'الدراسة', color: '#0ea5e9' },
  { id: 'cat-personal', name: 'شخصي', color: '#28a745' },
  { id: 'cat-health', name: 'صحة ولياقة', color: '#f59e0b' }
];

export const DEFAULT_SAVE_SLOTS: SaveSlotMeta[] = [
  {
    id: 'slot-1',
    slotNumber: 1,
    title: 'الدراسة والجامعة',
    color: '#217346',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'slot-2',
    slotNumber: 2,
    title: 'العمل والمشاريع',
    color: '#0ea5e9',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'slot-3',
    slotNumber: 3,
    title: 'المهام الشخصية',
    color: '#f59e0b',
    updatedAt: new Date().toISOString()
  }
];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#217346').replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(33, 115, 70, ${alpha})`;
}

export function createInitialTasks(today: Date): Task[] {
  const todayKey = formatDateKey(today);
  const tomorrowKey = formatDateKey(addDays(today, 1));
  const nextTwoDaysKey = formatDateKey(addDays(today, 2));
  const yesterdayKey = formatDateKey(addDays(today, -1));

  return [
    {
      id: 'task-unscheduled-1',
      title: 'مراجعة محاضرة هياكل البيانات والخوارزميات',
      categoryId: 'cat-study',
      date: null,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-101', text: 'تلخيص الأشجار الثنائية المتوازنة AVL', completed: true },
        { id: 'step-102', text: 'حل تمارين البحث الثنائي', completed: true },
        { id: 'step-103', text: 'مراجعة تعقيد الخوارزميات Big-O', completed: false }
      ]
    },
    {
      id: 'task-unscheduled-2',
      title: 'قراءة الفصل الرابع من كتاب Clean Architecture',
      categoryId: 'cat-study',
      date: null,
      completed: false,
      order: 1,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-201', text: 'تلخيص المبادئ الأساسية في ملاحظات', completed: true },
        { id: 'step-202', text: 'تطبيق أمثلة TypeScript العملية', completed: false }
      ]
    },
    {
      id: 'task-unscheduled-3',
      title: 'تجهيز عرض مشروع التخرج الفصلي',
      categoryId: 'cat-work',
      date: null,
      completed: false,
      order: 2,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-301', text: 'تصميم مخطط قاعدة البيانات', completed: false },
        { id: 'step-302', text: 'كتابة التقرير التقني المختصر', completed: false }
      ]
    },
    {
      id: 'task-unscheduled-4',
      title: 'تمرين الإطالة والمشي السريع لمدة 40 دقيقة',
      categoryId: 'cat-health',
      date: null,
      completed: false,
      order: 3,
      createdAt: new Date().toISOString(),
      subSteps: []
    },
    {
      id: 'task-today-1',
      title: 'تسليم واجب هندسة البرمجيات المتقدمة',
      categoryId: 'cat-study',
      date: todayKey,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-401', text: 'كتابة اختبارات الوحدات Unit Tests', completed: true },
        { id: 'step-402', text: 'توثيق واجهات البرمجة API', completed: true },
        { id: 'step-403', text: 'مراجعة معايير الجودة الصارمة TypeScript', completed: true },
        { id: 'step-404', text: 'رفع المشروع على البوابة الجامعية', completed: false }
      ]
    },
    {
      id: 'task-today-2',
      title: 'جلسة مذاكرة قواعد البيانات SQL',
      categoryId: 'cat-study',
      date: todayKey,
      completed: false,
      order: 1,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-501', text: 'تطبيق الفهارس المركبة Indexes', completed: true },
        { id: 'step-502', text: 'تحسين أداء الاستعلامات المعقدة', completed: false }
      ]
    },
    {
      id: 'task-tomorrow-1',
      title: 'تحضير العرض التقديمي لاجتماع الفريق',
      categoryId: 'cat-work',
      date: tomorrowKey,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-601', text: 'تجميع مؤشرات الإنجاز الشهرية', completed: false },
        { id: 'step-602', text: 'تصميم شرائح الملخص التنفيذي', completed: false }
      ]
    },
    {
      id: 'task-yesterday-1',
      title: 'تحديث خطة القراءة الشهرية وتنظيم المكتب',
      categoryId: 'cat-personal',
      date: yesterdayKey,
      completed: true,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-701', text: 'فرز الكتب حسب الأولوية', completed: true },
        { id: 'step-702', text: 'تنظيف مساحة العمل', completed: true }
      ]
    },
    {
      id: 'task-next2-1',
      title: 'تمارين القوة واللياقة البدنية',
      categoryId: 'cat-health',
      date: nextTwoDaysKey,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 'step-801', text: 'الإحماء الحركي 10 دقائق', completed: false },
        { id: 'step-802', text: 'تمارين المقاومة الأساسية', completed: false }
      ]
    }
  ];
}

export function createSlot2Tasks(today: Date): Task[] {
  const todayKey = formatDateKey(today);
  const tomorrowKey = formatDateKey(addDays(today, 1));
  return [
    {
      id: 's2-task-1',
      title: 'إعداد التقرير المالي الشهري في Excel',
      categoryId: 'cat-work',
      date: todayKey,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 's2-step-1', text: 'مراجعة جداول الإيرادات والمصروفات', completed: true },
        { id: 's2-step-2', text: 'تدقيق المعادلات والرسوم البيانية', completed: false }
      ]
    },
    {
      id: 's2-task-2',
      title: 'اجتماع متابعة خارطة طريق المنتج الربع سنوية',
      categoryId: 'cat-work',
      date: tomorrowKey,
      completed: true,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 's2-step-3', text: 'إرسال جدول الأعمال للفريق', completed: true },
        { id: 's2-step-4', text: 'تحديد أولويات الإصدار القادم', completed: true }
      ]
    },
    {
      id: 's2-task-3',
      title: 'تحسين سرعة استجابة الخادم وتقليل زمن التحميل',
      categoryId: 'cat-work',
      date: null,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: []
    }
  ];
}

export function createSlot3Tasks(today: Date): Task[] {
  const todayKey = formatDateKey(today);
  return [
    {
      id: 's3-task-1',
      title: 'ترتيب خطة المشتريات الأسبوعية للمنزل',
      categoryId: 'cat-personal',
      date: todayKey,
      completed: true,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 's3-step-1', text: 'شراء الخضروات والفواكه الطازجة', completed: true },
        { id: 's3-step-2', text: 'تحضير مستلزمات القهوة المختصة', completed: true }
      ]
    },
    {
      id: 's3-task-2',
      title: 'جلسة رياضة مسائية وتمارين إطالة',
      categoryId: 'cat-health',
      date: null,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      subSteps: [
        { id: 's3-step-3', text: 'المشي السريع 30 دقيقة', completed: true },
        { id: 's3-step-4', text: 'تمارين المرونة والتنفس', completed: false }
      ]
    }
  ];
}

export function createDefaultSlotData(slotId: string, today: Date): SaveSlotData {
  let tasks: Task[] = [];
  if (slotId === 'slot-1') {
    tasks = createInitialTasks(today);
  } else if (slotId === 'slot-2') {
    tasks = createSlot2Tasks(today);
  } else if (slotId === 'slot-3') {
    tasks = createSlot3Tasks(today);
  }
  return {
    tasks,
    categories: DEFAULT_CATEGORIES.map((c) => Object.assign({}, c)),
    sidebarPosition: 'right',
    dateMode: 'both',
    updatedAt: new Date().toISOString()
  };
}
