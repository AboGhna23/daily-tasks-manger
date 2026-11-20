import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  Sun,
  Moon,
  Layers
} from 'lucide-react';
import { COLOR_MATRIX_ROWS, hexToRgba } from '../utils/defaultData.ts';
import type { SaveSlotMeta, SaveSlotData, ThemeMode } from '../types/index.ts';

export interface SaveSlotsScreenProps {
  slots: SaveSlotMeta[];
  slotDataMap: Record<string, SaveSlotData>;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSlot: (slotId: string) => void;
  onCreateSlot: (title: string, color: string) => void;
  onRenameSlot: (slotId: string, title: string, color: string) => void;
  onResetSlot: (slotId: string) => void;
  onDeleteSlot: (slotId: string) => void;
}

export function SaveSlotsScreen({
  slots,
  slotDataMap,
  theme,
  onToggleTheme,
  onOpenSlot,
  onCreateSlot,
  onRenameSlot,
  onResetSlot,
  onDeleteSlot
}: SaveSlotsScreenProps) {
  const [editingSlotId, setEditingSlotId] = useState(null as string | null);
  const [editTitle, setEditTitle] = useState('' as string);
  const [editColor, setEditColor] = useState('#217346' as string);

  const [confirmState, setConfirmState] = useState(
    null as { slotId: string; mode: 'reset' | 'delete' } | null
  );

  const [isAddingNew, setIsAddingNew] = useState(false as boolean);
  const [newTitle, setNewTitle] = useState('' as string);
  const [newColor, setNewColor] = useState('#217346' as string);

  const startRename = (slot: SaveSlotMeta) => {
    setConfirmState(null);
    setEditingSlotId(slot.id);
    setEditTitle(slot.title);
    setEditColor(slot.color);
  };

  const handleSaveRename = (slotId: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onRenameSlot(slotId, trimmed, editColor);
    setEditingSlotId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newTitle.trim() || `التخزينة ${slots.length + 1}`;
    onCreateSlot(trimmed, newColor);
    setNewTitle('');
    setNewColor('#217346');
    setIsAddingNew(false);
  };

  return (
    <div className="af-slots-screen" data-testid="save-slots-screen">
      {/* Top Minimal Header */}
      <header className="af-header" data-testid="slots-header">
        <div className="flex items-center gap-2.5">
          <div className="af-excel-badge">
            <Layers size={16} color="#ffffff" />
          </div>
          <h1 className="font-bold text-sm">التخزينات</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="af-btn af-btn-primary text-xs"
            data-testid="header-add-slot-btn"
          >
            <Plus size={14} />
            <span>إضافة تخزينة</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="af-btn"
            title={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
            data-testid="slots-theme-toggle-btn"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
          </button>
        </div>
      </header>

      {/* Save Slots Grid Body */}
      <div className="af-slots-body">
        <div className="af-slots-grid" data-testid="save-slots-grid">
          {slots.map((slot) => {
            const isEditing = editingSlotId === slot.id;
            const confirmForThis =
              confirmState && confirmState.slotId === slot.id ? confirmState.mode : null;
            const paddedNumber = String(slot.slotNumber).padStart(2, '0');

            return (
              <div
                key={slot.id}
                className="af-slot-card"
                data-testid={`save-slot-card-${slot.id}`}
              >
                {/* Top Colored Accent Strip */}
                <div
                  className="af-slot-accent-bar"
                  style={{ backgroundColor: slot.color }}
                />

                {/* Card Header: Slot Number Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="af-slot-num-badge"
                    style={{
                      backgroundColor: hexToRgba(slot.color, 0.16),
                      color: slot.color,
                      borderColor: hexToRgba(slot.color, 0.35)
                    }}
                    data-testid={`slot-badge-${slot.id}`}
                  >
                    تخزينة {paddedNumber}
                  </span>

                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: slot.color,
                      display: 'inline-block'
                    }}
                  />
                </div>

                {/* Slot Title or Inline Rename Form */}
                {isEditing ? (
                  <div
                    className="p-2.5 rounded bg-subtle border-subtle flex flex-col gap-2"
                    data-testid={`rename-slot-form-${slot.id}`}
                  >
                    <input
                      type="text"
                      dir="auto"
                      value={editTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditTitle(e.target.value)
                      }
                      className="af-input text-xs font-bold"
                      placeholder="اسم التخزينة..."
                      data-testid={`rename-slot-input-${slot.id}`}
                    />
                    <div className="af-color-matrix">
                      {COLOR_MATRIX_ROWS.slice(1, 5).map((row, rIdx) =>
                        row.map((hex, cIdx) => {
                          const isSelected = editColor.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={`${rIdx}-${cIdx}-${hex}`}
                              type="button"
                              onClick={() => setEditColor(hex)}
                              className={`af-color-matrix-tile ${
                                isSelected ? 'af-color-matrix-tile-selected' : ''
                              }`}
                              style={{ backgroundColor: hex, color: '#ffffff' }}
                            >
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(null)}
                        className="af-btn text-xs"
                      >
                        <X size={12} />
                        <span>إلغاء</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRename(slot.id)}
                        className="af-btn af-btn-primary text-xs"
                        data-testid={`save-rename-slot-btn-${slot.id}`}
                      >
                        <Check size={12} />
                        <span>حفظ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => onOpenSlot(slot.id)}
                  >
                    <h2
                      dir="auto"
                      className="text-base font-bold text-primary truncate"
                      data-testid={`slot-title-${slot.id}`}
                    >
                      {slot.title}
                    </h2>
                  </div>
                )}

                {/* Confirmation Bar for Reset / Delete */}
                {confirmForThis ? (
                  <div
                    className="p-2 rounded flex items-center justify-between gap-2"
                    style={{
                      backgroundColor: 'var(--danger-soft)',
                      border: '1px solid var(--danger)'
                    }}
                    data-testid={`slot-confirm-box-${slot.id}`}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--danger)' }}>
                      {confirmForThis === 'reset' ? 'تأكيد التصفير؟' : 'تأكيد الحذف؟'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmForThis === 'reset') {
                            onResetSlot(slot.id);
                          } else {
                            onDeleteSlot(slot.id);
                          }
                          setConfirmState(null);
                        }}
                        className="af-btn af-btn-danger text-xs"
                        data-testid={`confirm-slot-action-btn-${slot.id}`}
                      >
                        <Check size={12} />
                        <span>تأكيد</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmState(null)}
                        className="af-btn text-xs"
                        data-testid={`cancel-slot-action-btn-${slot.id}`}
                      >
                        <span>إلغاء</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons Row */
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onOpenSlot(slot.id)}
                      className="af-btn af-btn-primary flex-1 py-1.5" style={{ minWidth: '110px' }}
                      data-testid={`open-slot-btn-${slot.id}`}
                    >
                      <CalendarDays size={14} />
                      <span>الدخول للتقويم</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(slot)}
                      className="af-btn py-1.5"
                      title="إعادة تسمية"
                      data-testid={`rename-slot-btn-${slot.id}`}
                    >
                      <Edit2 size={13} />
                      <span>إعادة تسمية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmState({ slotId: slot.id, mode: 'reset' })
                      }
                      className="af-btn py-1.5"
                      title="تصفير"
                      data-testid={`reset-slot-btn-${slot.id}`}
                    >
                      <RotateCcw size={13} />
                      <span>تصفير</span>
                    </button>

                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({ slotId: slot.id, mode: 'delete' })
                        }
                        className="af-icon-btn"
                        style={{
                          color: 'var(--danger)',
                          border: '1px solid var(--border-subtle)',
                          width: '30px',
                          height: '30px'
                        }}
                        title="حذف التخزينة"
                        data-testid={`delete-slot-btn-${slot.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ إضافة تخزينة جديدة" Card */}
          <div
            className="af-slot-card af-slot-card-add"
            data-testid="add-slot-card"
          >
            {isAddingNew ? (
              <form
                onSubmit={handleCreateSubmit}
                className="flex flex-col gap-2.5 h-full justify-between"
                data-testid="create-slot-form"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    تخزينة جديدة
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="af-icon-btn"
                    style={{ width: '24px', height: '24px' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  dir="auto"
                  value={newTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTitle(e.target.value)
                  }
                  placeholder="اسم التخزينة..."
                  className="af-input text-xs"
                  data-testid="new-slot-title-input"
                />

                <div className="af-color-matrix">
                  {COLOR_MATRIX_ROWS.slice(1, 5).map((row, rIdx) =>
                    row.map((hex, cIdx) => {
                      const isSelected = newColor.toLowerCase() === hex.toLowerCase();
                      return (
                        <button
                          key={`${rIdx}-${cIdx}-${hex}`}
                          type="button"
                          onClick={() => setNewColor(hex)}
                          className={`af-color-matrix-tile ${
                            isSelected ? 'af-color-matrix-tile-selected' : ''
                          }`}
                          style={{ backgroundColor: hex, color: '#ffffff' }}
                          data-testid={`new-slot-color-${hex}`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="af-btn text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="af-btn af-btn-primary text-xs"
                    data-testid="confirm-create-slot-btn"
                  >
                    <Plus size={14} />
                    <span>إنشاء</span>
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-2 py-6 text-center"
                data-testid="open-create-slot-btn"
              >
                <div
                  className="flex items-center justify-center rounded"
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--excel-bright)',
                    border: '1px solid var(--accent-primary)'
                  }}
                >
                  <Plus size={20} />
                </div>
                <span className="font-bold text-sm text-primary">
                  + إضافة تخزينة جديدة
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
