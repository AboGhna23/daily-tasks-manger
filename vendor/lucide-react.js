import React from './react.js';

function createIcon(paths) {
  return function LucideIcon(props = {}) {
    const {
      size = 18,
      className = '',
      strokeWidth = 2,
      color = 'currentColor',
      style
    } = props;
    return React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        className: `lucide-icon inline-block shrink-0 ${className}`.trim(),
        style
      },
      ...paths.map((item, i) =>
        React.createElement(item[0], Object.assign({ key: i }, item[1]))
      )
    );
  };
}

export const Calendar = createIcon([
  ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2', ry: '2' }],
  ['line', { x1: '16', x2: '16', y1: '2', y2: '6' }],
  ['line', { x1: '8', x2: '8', y1: '2', y2: '6' }],
  ['line', { x1: '3', x2: '21', y1: '10', y2: '10' }]
]);

export const CalendarDays = createIcon([
  ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2', ry: '2' }],
  ['line', { x1: '16', x2: '16', y1: '2', y2: '6' }],
  ['line', { x1: '8', x2: '8', y1: '2', y2: '6' }],
  ['line', { x1: '3', x2: '21', y1: '10', y2: '10' }],
  ['path', { d: 'M8 14h.01' }],
  ['path', { d: 'M12 14h.01' }],
  ['path', { d: 'M16 14h.01' }],
  ['path', { d: 'M8 18h.01' }],
  ['path', { d: 'M12 18h.01' }],
  ['path', { d: 'M16 18h.01' }]
]);

export const Plus = createIcon([
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'M12 5v14' }]
]);

export const Trash2 = createIcon([
  ['path', { d: 'M3 6h18' }],
  ['path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }],
  ['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }],
  ['line', { x1: '10', x2: '10', y1: '11', y2: '17' }],
  ['line', { x1: '14', x2: '14', y1: '11', y2: '17' }]
]);

export const Check = createIcon([
  ['path', { d: 'M20 6 9 17l-5-5' }]
]);

export const ChevronRight = createIcon([
  ['path', { d: 'm9 18 6-6-6-6' }]
]);

export const ChevronLeft = createIcon([
  ['path', { d: 'm15 18-6-6 6-6' }]
]);

export const Sun = createIcon([
  ['circle', { cx: '12', cy: '12', r: '4' }],
  ['path', { d: 'M12 2v2' }],
  ['path', { d: 'M12 20v2' }],
  ['path', { d: 'm4.93 4.93 1.41 1.41' }],
  ['path', { d: 'm17.66 17.66 1.41 1.41' }],
  ['path', { d: 'M2 12h2' }],
  ['path', { d: 'M20 12h2' }],
  ['path', { d: 'm6.34 17.66-1.41 1.41' }],
  ['path', { d: 'm19.07 4.93-1.41 1.41' }]
]);

export const Moon = createIcon([
  ['path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }]
]);

export const Tag = createIcon([
  ['path', { d: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z' }],
  ['circle', { cx: '7.5', cy: '7.5', r: '.5', fill: 'currentColor' }]
]);

export const GripVertical = createIcon([
  ['circle', { cx: '9', cy: '12', r: '1' }],
  ['circle', { cx: '9', cy: '5', r: '1' }],
  ['circle', { cx: '9', cy: '19', r: '1' }],
  ['circle', { cx: '15', cy: '12', r: '1' }],
  ['circle', { cx: '15', cy: '5', r: '1' }],
  ['circle', { cx: '15', cy: '19', r: '1' }]
]);

export const PanelLeft = createIcon([
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
  ['path', { d: 'M9 3v18' }]
]);

export const PanelRight = createIcon([
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
  ['path', { d: 'M15 3v18' }]
]);

export const X = createIcon([
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }]
]);

export const Edit2 = createIcon([
  ['path', { d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' }],
  ['path', { d: 'm15 5 4 4' }]
]);

export const CornerUpLeft = createIcon([
  ['polyline', { points: '9 14 4 9 9 4' }],
  ['path', { d: 'M20 20v-7a4 4 0 0 0-4-4H4' }]
]);

export const ArrowUp = createIcon([
  ['path', { d: 'm5 12 7-7 7 7' }],
  ['path', { d: 'M12 19V5' }]
]);

export const ArrowDown = createIcon([
  ['path', { d: 'M12 5v14' }],
  ['path', { d: 'm19 12-7 7-7-7' }]
]);

export const CheckSquare = createIcon([
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
  ['path', { d: 'm9 12 2 2 4-4' }]
]);

export const Sparkles = createIcon([
  ['path', { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' }]
]);

export const ListTodo = createIcon([
  ['rect', { x: '3', y: '5', width: '6', height: '6', rx: '1' }],
  ['path', { d: 'm3 17 2 2 4-4' }],
  ['path', { d: 'M13 6h8' }],
  ['path', { d: 'M13 12h8' }],
  ['path', { d: 'M13 18h8' }]
]);

export const Palette = createIcon([
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }],
  ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' }]
]);

export const RotateCcw = createIcon([
  ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
  ['path', { d: 'M3 3v5h5' }]
]);

export const CheckCircle2 = createIcon([
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm9 12 2 2 4-4' }]
]);

export const Circle = createIcon([
  ['circle', { cx: '12', cy: '12', r: '10' }]
]);

export const Layers = createIcon([
  ['path', { d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' }],
  ['path', { d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' }],
  ['path', { d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' }]
]);

export const Maximize2 = createIcon([
  ['polyline', { points: '15 3 21 3 21 9' }],
  ['polyline', { points: '9 21 3 21 3 15' }],
  ['line', { x1: '21', x2: '14', y1: '3', y2: '10' }],
  ['line', { x1: '3', x2: '10', y1: '21', y2: '14' }]
]);

export const EyeOff = createIcon([
  ['path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }],
  ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }],
  ['path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }],
  ['path', { d: 'm2 2 20 20' }]
]);

export const Copy = createIcon([
  ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
  ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }]
]);

export const XCircle = createIcon([
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm15 9-6 6' }],
  ['path', { d: 'm9 9 6 6' }]
]);
