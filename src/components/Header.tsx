import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Tag,
  Sun,
  Moon,
  Layers,
  PanelRight,
  PanelLeft,
  EyeOff
} from 'lucide-react';
import type { Category, DateMode, SidebarPosition, ThemeMode } from '../types/index.ts';

export interface HeaderProps {
  slotTitle: string;
  slotColor: string;
  onBackToSlots: () => void;
  primaryLabel: string;
  secondaryLabel: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  sidebarPosition: SidebarPosition;
  onChangeSidebarPosition: (position: SidebarPosition) => void;
  dateMode: DateMode;
  onChangeDateMode: (mode: DateMode) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  categories: Category[];
  onOpenCategoryModal: () => void;
}

interface SegmentOption {
  value: string;
  label: string;
}

const DATE_MODE_OPTIONS: SegmentOption[] = [
  { value: 'both', label: 'هجري + ميلادي' },
  { value: 'gregorian', label: 'ميلادي' },
  { value: 'hijri', label: 'هجري' }
];

export function Header({
  slotTitle,
  slotColor,
  onBackToSlots,
  primaryLabel,
  secondaryLabel,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  sidebarPosition,
  onChangeSidebarPosition,
  dateMode,
  onChangeDateMode,
  theme,
  onToggleTheme,
  categories,
  onOpenCategoryModal
}: HeaderProps) {
  return (
    <header className="af-header" data-testid="app-header">
      {/* Right Section: Save Slots Button + Active Slot Title */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onBackToSlots}
          className="af-btn af-btn-slots"
          title="العودة إلى شاشة اختيار التخزينة"
          data-testid="back-to-slots-btn"
        >
          <Layers size={14} />
          <span>التخزينات</span>
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-subtle border-subtle">
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: slotColor,
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          <h1
            dir="auto"
            className="font-bold text-xs truncate"
            style={{ maxWidth: '150px' }}
            data-testid="active-slot-header-title"
          >
            {slotTitle}
          </h1>
        </div>
      </div>

      {/* Center Section: Month & Year Navigation */}
      <div className="af-nav-strip flex items-center gap-1 px-1.5 py-1 rounded shrink-0">
        <button
          type="button"
          onClick={onPrevMonth}
          className="af-btn"
          style={{ padding: '3px 7px' }}
          title="الشهر السابق"
          data-testid="prev-month-btn"
        >
          <ChevronRight size={13} />
          <span>السابق</span>
        </button>

        <div
          className="px-2"
          style={{ minWidth: '110px', textAlign: 'center', lineHeight: '1.2' }}
          data-testid="current-month-label"
        >
          <div
            className="font-bold text-xs"
            style={{ whiteSpace: 'nowrap' }}
            data-testid="month-label-primary"
          >
            {primaryLabel}
          </div>
          {secondaryLabel && (
            <div
              className="text-secondary font-semibold"
              style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}
              data-testid="month-label-secondary"
            >
              {secondaryLabel}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="af-btn"
          style={{ padding: '3px 7px' }}
          title="الشهر التالي"
          data-testid="next-month-btn"
        >
          <span>التالي</span>
          <ChevronLeft size={13} />
        </button>

        <div
          style={{
            width: '1px',
            height: '15px',
            backgroundColor: 'var(--border-strong)',
            margin: '0 1px'
          }}
        />

        <button
          type="button"
          onClick={onGoToday}
          className="af-btn af-btn-primary"
          style={{ padding: '3px 8px' }}
          title="الانتقال إلى الشهر واليوم الحالي"
          data-testid="today-btn"
        >
          <span>اليوم</span>
        </button>
      </div>

      {/* Left Section: Date Mode + Icon-Only Sidebar Control + Categories + Theme */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        <div
          className="af-segmented"
          role="group"
          aria-label="نظام التاريخ"
          data-testid="date-mode"
        >
          {DATE_MODE_OPTIONS.map((opt) => {
            const active = opt.value === dateMode;
            return (
              <button
                key={opt.value}
                type="button"
                className={`af-segmented-btn ${active ? 'af-segmented-btn-active' : ''}`}
                aria-pressed={active ? 'true' : 'false'}
                data-testid={`date-mode-${opt.value}`}
                onClick={() => onChangeDateMode(opt.value as DateMode)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 3-State Sidebar Position & Hide Control (Formal Icons Only) */}
        <div
          className="af-segmented"
          role="group"
          aria-label="موقع القائمة"
          data-testid="sidebar-position"
        >
          <button
            type="button"
            title="يمين"
            aria-label="يمين"
            aria-pressed={sidebarPosition === 'right' ? 'true' : 'false'}
            className={`af-segmented-btn af-segmented-icon-btn ${
              sidebarPosition === 'right' ? 'af-segmented-btn-active' : ''
            }`}
            data-testid="sidebar-position-right"
            onClick={() => onChangeSidebarPosition('right')}
          >
            <PanelRight size={14} />
          </button>

          <button
            type="button"
            title="يسار"
            aria-label="يسار"
            aria-pressed={sidebarPosition === 'left' ? 'true' : 'false'}
            className={`af-segmented-btn af-segmented-icon-btn ${
              sidebarPosition === 'left' ? 'af-segmented-btn-active' : ''
            }`}
            data-testid="sidebar-position-left"
            onClick={() => onChangeSidebarPosition('left')}
          >
            <PanelLeft size={14} />
          </button>

          <button
            type="button"
            title="إخفاء"
            aria-label="إخفاء"
            aria-pressed={sidebarPosition === 'hidden' ? 'true' : 'false'}
            className={`af-segmented-btn af-segmented-icon-btn ${
              sidebarPosition === 'hidden' ? 'af-segmented-btn-active' : ''
            }`}
            data-testid="sidebar-position-hidden"
            onClick={() => onChangeSidebarPosition('hidden')}
          >
            <EyeOff size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="af-btn"
          title="إدارة التصنيفات والألوان"
          data-testid="manage-categories-btn"
        >
          <Tag size={13} />
          <span>التصنيفات</span>
          <span className="flex items-center gap-1">
            {categories.slice(0, 4).map((cat) => (
              <span
                key={cat.id}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '2px',
                  backgroundColor: cat.color,
                  display: 'inline-block'
                }}
              />
            ))}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="af-btn"
          title={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
          data-testid="theme-toggle-btn"
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
        </button>
      </div>
    </header>
  );
}
