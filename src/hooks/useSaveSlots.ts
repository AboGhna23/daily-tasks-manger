import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SAVE_SLOTS,
  DEFAULT_CATEGORIES,
  createDefaultSlotData
} from '../utils/defaultData.ts';
import { withAutoCompletion } from '../utils/progress.ts';
import type {
  SaveSlotMeta,
  SaveSlotData,
  Task,
  Category,
  SidebarPosition,
  DateMode
} from '../types/index.ts';

const SLOTS_LIST_KEY = 'af_save_slots_list_v1';
const ACTIVE_SLOT_SESSION_KEY = 'af_active_slot_session_v1';

function getSlotStorageKey(slotId: string): string {
  return `af_slot_data_v1_${slotId}`;
}

function loadJson<T>(key: string, fallback: () => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed saving to localStorage:', key, err);
  }
}

function normalizeSlotData(raw: Partial<SaveSlotData>, slotId: string, today: Date): SaveSlotData {
  const defaults = createDefaultSlotData(slotId, today);
  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : defaults.tasks;
  const rawCategories = Array.isArray(raw.categories) ? raw.categories : defaults.categories;
  const sidebarPosition: SidebarPosition =
    raw.sidebarPosition === 'right' ||
    raw.sidebarPosition === 'left' ||
    raw.sidebarPosition === 'hidden'
      ? raw.sidebarPosition
      : defaults.sidebarPosition;
  const dateMode: DateMode =
    raw.dateMode === 'both' || raw.dateMode === 'gregorian' || raw.dateMode === 'hijri'
      ? raw.dateMode
      : defaults.dateMode;

  return {
    tasks: rawTasks.map((t: Task) => withAutoCompletion(t)),
    categories: rawCategories.length > 0 ? rawCategories : DEFAULT_CATEGORIES,
    sidebarPosition,
    dateMode,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : defaults.updatedAt
  };
}

export interface UseSaveSlotsResult {
  slots: SaveSlotMeta[];
  slotDataMap: Record<string, SaveSlotData>;
  activeSlotId: string | null;
  activeSlotMeta: SaveSlotMeta | null;
  activeSlotData: SaveSlotData | null;
  openSlot: (slotId: string) => void;
  returnToSlotsScreen: () => void;
  createSlot: (title: string, color: string) => string;
  renameSlot: (slotId: string, title: string, color: string) => void;
  resetSlot: (slotId: string) => void;
  deleteSlot: (slotId: string) => void;
  updateActiveSlotTasks: (updater: (prev: Task[]) => Task[]) => void;
  updateActiveSlotCategories: (updater: (prev: Category[]) => Category[]) => void;
  updateActiveSlotSidebar: (pos: SidebarPosition) => void;
  updateActiveSlotDateMode: (mode: DateMode) => void;
}

export function useSaveSlots(today: Date): UseSaveSlotsResult {
  const [slots, setSlots] = useState(() => {
    const loaded = loadJson<SaveSlotMeta[]>(SLOTS_LIST_KEY, () => DEFAULT_SAVE_SLOTS);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : DEFAULT_SAVE_SLOTS;
  });

  const [slotDataMap, setSlotDataMap] = useState(() => {
    const initialSlots = loadJson<SaveSlotMeta[]>(SLOTS_LIST_KEY, () => DEFAULT_SAVE_SLOTS);
    const list = Array.isArray(initialSlots) && initialSlots.length > 0 ? initialSlots : DEFAULT_SAVE_SLOTS;
    const map: Record<string, SaveSlotData> = {};
    for (const s of list) {
      const key = getSlotStorageKey(s.id);
      const stored = loadJson<Partial<SaveSlotData> | null>(key, () => null);
      if (stored) {
        map[s.id] = normalizeSlotData(stored, s.id, today);
      } else {
        const created = createDefaultSlotData(s.id, today);
        map[s.id] = created;
        saveJson(key, created);
      }
    }
    return map;
  });

  const [activeSlotId, setActiveSlotId] = useState(() => {
    try {
      const sessionSlot = window.sessionStorage.getItem(ACTIVE_SLOT_SESSION_KEY);
      return sessionSlot || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    saveJson(SLOTS_LIST_KEY, slots);
  }, [slots]);

  const openSlot = useCallback((slotId: string) => {
    setActiveSlotId(slotId);
    try {
      window.sessionStorage.setItem(ACTIVE_SLOT_SESSION_KEY, slotId);
    } catch {
      // ignore
    }
  }, []);

  const returnToSlotsScreen = useCallback(() => {
    setActiveSlotId(null);
    try {
      window.sessionStorage.removeItem(ACTIVE_SLOT_SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const createSlot = useCallback(
    (title: string, color: string): string => {
      const nowIso = new Date().toISOString();
      const newId = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const nextNum =
        slots.reduce((max, s) => (s.slotNumber > max ? s.slotNumber : max), 0) + 1;
      const newMeta: SaveSlotMeta = {
        id: newId,
        slotNumber: nextNum,
        title: title.trim() || `التخزينة ${nextNum}`,
        color: color || '#217346',
        updatedAt: nowIso
      };
      const newData: SaveSlotData = {
        tasks: [],
        categories: DEFAULT_CATEGORIES.map((c) => Object.assign({}, c)),
        sidebarPosition: 'right',
        dateMode: 'both',
        updatedAt: nowIso
      };
      saveJson(getSlotStorageKey(newId), newData);
      setSlotDataMap((prev) => Object.assign({}, prev, { [newId]: newData }));
      setSlots((prev) => [...prev, newMeta]);
      return newId;
    },
    [slots]
  );

  const renameSlot = useCallback((slotId: string, title: string, color: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const nowIso = new Date().toISOString();
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? Object.assign({}, s, { title: trimmed, color, updatedAt: nowIso })
          : s
      )
    );
  }, []);

  const resetSlot = useCallback((slotId: string) => {
    const nowIso = new Date().toISOString();
    setSlotDataMap((prev) => {
      const current = prev[slotId];
      const resetData: SaveSlotData = {
        tasks: [],
        categories: current ? current.categories : DEFAULT_CATEGORIES.map((c) => Object.assign({}, c)),
        sidebarPosition: current ? current.sidebarPosition : 'right',
        dateMode: current ? current.dateMode : 'both',
        updatedAt: nowIso
      };
      saveJson(getSlotStorageKey(slotId), resetData);
      return Object.assign({}, prev, { [slotId]: resetData });
    });
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? Object.assign({}, s, { updatedAt: nowIso }) : s))
    );
  }, []);

  const deleteSlot = useCallback(
    (slotId: string) => {
      if (slots.length <= 1) {
        resetSlot(slotId);
        return;
      }
      try {
        window.localStorage.removeItem(getSlotStorageKey(slotId));
      } catch {
        // ignore
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      setSlotDataMap((prev) => {
        const next = Object.assign({}, prev);
        delete next[slotId];
        return next;
      });
      if (activeSlotId === slotId) {
        returnToSlotsScreen();
      }
    },
    [slots.length, activeSlotId, resetSlot, returnToSlotsScreen]
  );

  const mutateActiveSlot = useCallback(
    (mutator: (current: SaveSlotData) => SaveSlotData) => {
      if (!activeSlotId) return;
      const nowIso = new Date().toISOString();
      setSlotDataMap((prev) => {
        const current = prev[activeSlotId] || createDefaultSlotData(activeSlotId, today);
        const updated = Object.assign({}, mutator(current), { updatedAt: nowIso });
        saveJson(getSlotStorageKey(activeSlotId), updated);
        return Object.assign({}, prev, { [activeSlotId]: updated });
      });
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId ? Object.assign({}, s, { updatedAt: nowIso }) : s
        )
      );
    },
    [activeSlotId, today]
  );

  const updateActiveSlotTasks = useCallback(
    (updater: (prev: Task[]) => Task[]) => {
      mutateActiveSlot((curr) =>
        Object.assign({}, curr, {
          tasks: updater(curr.tasks).map((t) => withAutoCompletion(t))
        })
      );
    },
    [mutateActiveSlot]
  );

  const updateActiveSlotCategories = useCallback(
    (updater: (prev: Category[]) => Category[]) => {
      mutateActiveSlot((curr) =>
        Object.assign({}, curr, {
          categories: updater(curr.categories)
        })
      );
    },
    [mutateActiveSlot]
  );

  const updateActiveSlotSidebar = useCallback(
    (pos: SidebarPosition) => {
      mutateActiveSlot((curr) => Object.assign({}, curr, { sidebarPosition: pos }));
    },
    [mutateActiveSlot]
  );

  const updateActiveSlotDateMode = useCallback(
    (mode: DateMode) => {
      mutateActiveSlot((curr) => Object.assign({}, curr, { dateMode: mode }));
    },
    [mutateActiveSlot]
  );

  const activeSlotMeta = activeSlotId
    ? slots.find((s) => s.id === activeSlotId) || null
    : null;
  const activeSlotData =
    activeSlotId && slotDataMap[activeSlotId] ? slotDataMap[activeSlotId] : null;

  return {
    slots,
    slotDataMap,
    activeSlotId,
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
  };
}
