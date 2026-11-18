import React, { useState } from 'react';
import { X, Plus, Trash2, Palette, Check, Edit2 } from 'lucide-react';
import { COLOR_MATRIX_ROWS, hexToRgba } from '../utils/defaultData.ts';
import type { Category } from '../types/index.ts';

export interface CategoryModalProps {
  categories: Category[];
  onClose: () => void;
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

interface ColorMatrixProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  testIdPrefix: string;
}

function ColorMatrixPicker({ selectedColor, onSelectColor, testIdPrefix }: ColorMatrixProps) {
  return (
    <div className="af-color-matrix" data-testid={testIdPrefix}>
      {COLOR_MATRIX_ROWS.map((row, rowIndex) =>
        row.map((hex, colIndex) => {
          const isSelected = selectedColor.toLowerCase() === hex.toLowerCase();
          const isLightTile = rowIndex === 0;
          return (
            <button
              key={`${rowIndex}-${colIndex}-${hex}`}
              type="button"
              onClick={() => onSelectColor(hex)}
              className={`af-color-matrix-tile ${isSelected ? 'af-color-matrix-tile-selected' : ''}`}
              style={{
                backgroundColor: hex,
                color: isLightTile ? '#111111' : '#ffffff'
              }}
              title={hex}
              data-testid={`palette-color-${hex}`}
            >
              {isSelected && <Check size={11} strokeWidth={3} />}
            </button>
          );
        })
      )}
    </div>
  );
}

export function CategoryModal({
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoryModalProps) {
  const [newName, setNewName] = useState('' as string);
  const [newColor, setNewColor] = useState('#217346' as string);
  const [editingId, setEditingId] = useState(null as string | null);
  const [editName, setEditName] = useState('' as string);
  const [editColor, setEditColor] = useState('#217346' as string);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, newColor);
    setNewName('');
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEditing = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateCategory(id, trimmed, editColor);
    setEditingId(null);
  };

  return (
    <div
      className="af-modal-backdrop"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="category-modal"
    >
      <div
        className="af-modal-panel"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={16} color="var(--excel-bright)" />
            <h2 className="font-bold text-sm">التصنيفات والألوان</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="af-icon-btn"
            title="إغلاق"
            data-testid="close-category-modal-btn"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Create New Category Form */}
          <form
            onSubmit={handleCreate}
            className="p-3 rounded flex flex-col gap-2.5"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)'
            }}
            data-testid="create-category-form"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">
                تصنيف جديد
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded font-semibold text-xs"
                style={{
                  padding: '2px 8px',
                  backgroundColor: hexToRgba(newColor, 0.16),
                  color: newColor,
                  border: `1px solid ${hexToRgba(newColor, 0.35)}`
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '2px',
                    backgroundColor: newColor,
                    display: 'inline-block'
                  }}
                />
                <span dir="auto">{newName.trim() || 'معاينة'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="auto"
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewName(e.target.value)
                }
                placeholder="اسم التصنيف..."
                className="af-input text-xs"
                data-testid="new-category-name-input"
              />
              <button
                type="submit"
                className="af-btn af-btn-primary shrink-0"
                style={{ height: '34px' }}
                data-testid="add-category-btn"
              >
                <Plus size={15} />
                <span>إضافة</span>
              </button>
            </div>

            {/* Rocket League-Style 2D Color Swatch Matrix */}
            <ColorMatrixPicker
              selectedColor={newColor}
              onSelectColor={setNewColor}
              testIdPrefix="color-matrix-grid"
            />
          </form>

          {/* Existing Categories List */}
          <div className="flex flex-col gap-1.5" data-testid="categories-list">
            <span className="text-xs font-bold text-secondary">
              التصنيفات ({categories.length})
            </span>

            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="p-2.5 rounded bg-surface border-subtle flex flex-col gap-2"
                  data-testid={`category-row-${cat.id}`}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            backgroundColor: editColor,
                            display: 'inline-block',
                            flexShrink: 0
                          }}
                        />
                        <input
                          type="text"
                          dir="auto"
                          value={editName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditName(e.target.value)
                          }
                          className="af-input text-xs"
                          style={{ padding: '5px 8px' }}
                          data-testid={`edit-category-input-${cat.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => saveEditing(cat.id)}
                          className="af-btn af-btn-primary text-xs"
                          data-testid={`save-category-btn-${cat.id}`}
                        >
                          <Check size={13} />
                          <span>حفظ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="af-btn text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                      <ColorMatrixPicker
                        selectedColor={editColor}
                        onSelectColor={setEditColor}
                        testIdPrefix={`edit-color-matrix-${cat.id}`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            backgroundColor: cat.color,
                            display: 'inline-block'
                          }}
                        />
                        <span className="font-semibold text-xs" dir="auto">
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(cat)}
                          className="af-icon-btn"
                          style={{ width: '26px', height: '26px' }}
                          title="تعديل التصنيف"
                          data-testid={`edit-category-${cat.id}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="af-icon-btn"
                          style={{ width: '26px', height: '26px', color: 'var(--danger)' }}
                          title="حذف التصنيف"
                          data-testid={`delete-category-${cat.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t-subtle flex items-center justify-end bg-subtle">
          <button
            type="button"
            onClick={onClose}
            className="af-btn af-btn-primary"
          >
            <span>إغلاق</span>
          </button>
        </div>
      </div>
    </div>
  );
}
