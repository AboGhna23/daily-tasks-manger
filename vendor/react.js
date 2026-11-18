// Clean, fast, zero-dependency React 18-compatible ESM runtime for offline/local execution

export const Fragment = Symbol.for('react.fragment');

const SVG_TAGS = new Set([
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'g', 'defs', 'clipPath', 'linearGradient', 'stop', 'ellipse', 'text'
]);

const BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'readOnly', 'required', 'multiple', 'selected', 'hidden', 'autoFocus'
]);

export function createElement(type, props, ...children) {
  const normalizedProps = Object.assign({}, props || {});
  const key = normalizedProps.key !== undefined ? String(normalizedProps.key) : null;
  const ref = normalizedProps.ref !== undefined ? normalizedProps.ref : null;
  delete normalizedProps.key;
  delete normalizedProps.ref;

  const flatChildren = [];
  const flatten = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (Array.isArray(item)) {
        flatten(item);
      } else if (item === null || item === undefined || typeof item === 'boolean') {
        continue;
      } else if (typeof item === 'string' || typeof item === 'number') {
        flatChildren.push({
          type: '#text',
          props: { nodeValue: String(item) },
          children: [],
          key: null,
          ref: null
        });
      } else {
        flatChildren.push(item);
      }
    }
  };
  flatten(children);

  if (flatChildren.length > 0 && normalizedProps.children === undefined) {
    normalizedProps.children = flatChildren.length === 1 ? flatChildren[0] : flatChildren;
  }

  return {
    type,
    props: normalizedProps,
    children: flatChildren,
    key,
    ref
  };
}

let activeRoot = null;
let currentInstance = null;

export function useState(initialValue) {
  const inst = currentInstance;
  if (!inst) throw new Error('useState must be called inside a component');
  const idx = inst.hookIndex++;
  if (inst.hooks.length <= idx) {
    const init = typeof initialValue === 'function' ? initialValue() : initialValue;
    inst.hooks.push({ type: 'state', value: init });
  }
  const hook = inst.hooks[idx];
  const root = activeRoot;
  const setState = (updater) => {
    const nextValue = typeof updater === 'function' ? updater(hook.value) : updater;
    if (!Object.is(nextValue, hook.value)) {
      hook.value = nextValue;
      if (root) root.scheduleRender();
    }
  };
  return [hook.value, setState];
}

export function useRef(initialValue) {
  const inst = currentInstance;
  if (!inst) throw new Error('useRef must be called inside a component');
  const idx = inst.hookIndex++;
  if (inst.hooks.length <= idx) {
    inst.hooks.push({ type: 'ref', current: initialValue });
  }
  return inst.hooks[idx];
}

export function useMemo(factory, deps) {
  const inst = currentInstance;
  if (!inst) throw new Error('useMemo must be called inside a component');
  const idx = inst.hookIndex++;
  if (inst.hooks.length <= idx) {
    const value = factory();
    inst.hooks.push({ type: 'memo', value, deps });
    return value;
  }
  const hook = inst.hooks[idx];
  if (!deps || !hook.deps || depsChanged(hook.deps, deps)) {
    hook.value = factory();
    hook.deps = deps;
  }
  return hook.value;
}

export function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
}

export function useEffect(effect, deps) {
  const inst = currentInstance;
  if (!inst) throw new Error('useEffect must be called inside a component');
  const idx = inst.hookIndex++;
  if (inst.hooks.length <= idx) {
    const hook = { type: 'effect', deps, cleanup: null, pending: effect };
    inst.hooks.push(hook);
    if (activeRoot) activeRoot.pendingEffects.push(hook);
    return;
  }
  const hook = inst.hooks[idx];
  if (!deps || !hook.deps || depsChanged(hook.deps, deps)) {
    hook.deps = deps;
    hook.pending = effect;
    if (activeRoot) activeRoot.pendingEffects.push(hook);
  }
}

function depsChanged(oldDeps, newDeps) {
  if (oldDeps.length !== newDeps.length) return true;
  for (let i = 0; i < oldDeps.length; i++) {
    if (!Object.is(oldDeps[i], newDeps[i])) return true;
  }
  return false;
}

export function createRoot(container) {
  const instances = new Map();
  let visitedInstances = new Set();
  let renderQueued = false;
  let rootVNode = null;

  const rootObj = {
    pendingEffects: [],
    scheduleRender() {
      if (renderQueued) return;
      renderQueued = true;
      queueMicrotask(() => {
        renderQueued = false;
        performRender();
      });
    },
    render(vnode) {
      rootVNode = vnode;
      performRender();
    }
  };

  function expandVNode(vnode, path) {
    if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
      return [];
    }
    if (Array.isArray(vnode)) {
      const out = [];
      for (let i = 0; i < vnode.length; i++) {
        const subKey = vnode[i]?.key != null ? `k:${vnode[i].key}` : `i:${i}`;
        out.push(...expandVNode(vnode[i], `${path}/${subKey}`));
      }
      return out;
    }
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return [{ type: '#text', props: { nodeValue: String(vnode) }, children: [], key: null, ref: null }];
    }
    if (vnode.type === Fragment) {
      const out = [];
      const kids = vnode.children || [];
      for (let i = 0; i < kids.length; i++) {
        const subKey = kids[i]?.key != null ? `k:${kids[i].key}` : `i:${i}`;
        out.push(...expandVNode(kids[i], `${path}/F_${subKey}`));
      }
      return out;
    }
    if (typeof vnode.type === 'function') {
      const compId = `${path}::${vnode.type.name || 'Anon'}`;
      visitedInstances.add(compId);
      let inst = instances.get(compId);
      if (!inst || inst.type !== vnode.type) {
        if (inst) cleanupInstance(inst);
        inst = { type: vnode.type, hooks: [], hookIndex: 0 };
        instances.set(compId, inst);
      }
      inst.hookIndex = 0;
      const prevInstance = currentInstance;
      currentInstance = inst;
      let rendered;
      try {
        rendered = vnode.type(vnode.props || {});
      } finally {
        currentInstance = prevInstance;
      }
      const expanded = expandVNode(rendered, compId);
      if (vnode.key != null && expanded.length === 1 && expanded[0].key == null) {
        expanded[0] = Object.assign({}, expanded[0], { key: vnode.key });
      }
      return expanded;
    }
    // Intrinsic element ('div', 'span', 'svg', etc.)
    const expandedChildren = [];
    const rawKids = vnode.children || [];
    for (let i = 0; i < rawKids.length; i++) {
      const child = rawKids[i];
      const subKey = child?.key != null ? `k:${child.key}` : `i:${i}`;
      expandedChildren.push(...expandVNode(child, `${path}/${vnode.type}_${subKey}`));
    }
    return [{
      type: vnode.type,
      props: vnode.props || {},
      children: expandedChildren,
      key: vnode.key,
      ref: vnode.ref
    }];
  }

  function cleanupInstance(inst) {
    for (const h of inst.hooks) {
      if (h.type === 'effect' && typeof h.cleanup === 'function') {
        try { h.cleanup(); } catch (e) { console.error(e); }
      }
    }
  }

  function performRender() {
    activeRoot = rootObj;
    visitedInstances = new Set();
    rootObj.pendingEffects = [];

    const expandedTree = expandVNode(rootVNode, 'root');
    reconcileChildren(container, expandedTree, false);

    // Cleanup unmounted component instances
    for (const [id, inst] of instances.entries()) {
      if (!visitedInstances.has(id)) {
        cleanupInstance(inst);
        instances.delete(id);
      }
    }

    // Run pending effects
    const effectsToRun = rootObj.pendingEffects.slice();
    rootObj.pendingEffects = [];
    for (const eff of effectsToRun) {
      if (typeof eff.cleanup === 'function') {
        try { eff.cleanup(); } catch (e) { console.error(e); }
      }
      const fn = eff.pending;
      eff.pending = null;
      if (typeof fn === 'function') {
        const cleanup = fn();
        eff.cleanup = typeof cleanup === 'function' ? cleanup : null;
      }
    }
  }

  function createDomNode(vnode, isSvg) {
    if (vnode.type === '#text') {
      const textNode = document.createTextNode(vnode.props.nodeValue || '');
      textNode._vtag = '#text';
      textNode._vkey = null;
      return textNode;
    }
    const svgContext = isSvg || vnode.type === 'svg' || SVG_TAGS.has(vnode.type);
    const dom = svgContext
      ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
      : document.createElement(vnode.type);
    dom._vtag = vnode.type;
    dom._vkey = vnode.key;
    dom._vprops = {};
    dom._handlers = {};

    patchDomProps(dom, {}, vnode.props, svgContext);
    reconcileChildren(dom, vnode.children || [], svgContext);
    if (vnode.ref && typeof vnode.ref === 'object') {
      vnode.ref.current = dom;
    } else if (typeof vnode.ref === 'function') {
      vnode.ref(dom);
    }
    return dom;
  }

  function updateDomNode(dom, vnode, isSvg) {
    if (vnode.type === '#text') {
      const nextText = vnode.props.nodeValue || '';
      if (dom.nodeValue !== nextText) {
        dom.nodeValue = nextText;
      }
      return dom;
    }
    const svgContext = isSvg || vnode.type === 'svg' || SVG_TAGS.has(vnode.type);
    patchDomProps(dom, dom._vprops || {}, vnode.props || {}, svgContext);
    dom._vprops = vnode.props || {};
    dom._vkey = vnode.key;
    reconcileChildren(dom, vnode.children || [], svgContext);
    if (vnode.ref && typeof vnode.ref === 'object') {
      vnode.ref.current = dom;
    } else if (typeof vnode.ref === 'function') {
      vnode.ref(dom);
    }
    return dom;
  }

  function mapEventName(propName, tagName) {
    if (propName === 'onChange' && (tagName === 'input' || tagName === 'textarea')) {
      return 'input';
    }
    if (propName === 'onDoubleClick') return 'dblclick';
    return propName.slice(2).toLowerCase();
  }

  function patchDomProps(dom, oldProps, newProps, isSvg) {
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    for (const key of allKeys) {
      if (key === 'children' || key === 'key' || key === 'ref') continue;
      const prev = oldProps[key];
      const next = newProps[key];
      if (Object.is(prev, next) && key !== 'value' && key !== 'checked') continue;

      if (key.startsWith('on') && key.length > 2) {
        const evtName = mapEventName(key, dom._vtag);
        if (!dom._handlers) dom._handlers = {};
        if (!dom._handlers[evtName]) {
          const listener = (e) => {
            const fn = dom._handlers[evtName];
            if (typeof fn === 'function') fn(e);
          };
          dom._handlers[evtName + '_bound'] = listener;
          dom.addEventListener(evtName, listener);
        }
        dom._handlers[evtName] = next || null;
        continue;
      }

      if (key === 'style') {
        if (typeof next === 'string') {
          dom.style.cssText = next;
        } else {
          if (prev && typeof prev === 'object') {
            for (const sKey of Object.keys(prev)) {
              if (!next || !(sKey in next)) {
                dom.style[sKey] = '';
              }
            }
          }
          if (next && typeof next === 'object') {
            for (const [sKey, sVal] of Object.entries(next)) {
              if (sKey.startsWith('--')) {
                dom.style.setProperty(sKey, sVal ?? '');
              } else {
                dom.style[sKey] = sVal ?? '';
              }
            }
          }
        }
        continue;
      }

      if (key === 'className' || key === 'class') {
        const cls = next || '';
        if (isSvg) {
          if (cls) dom.setAttribute('class', cls);
          else dom.removeAttribute('class');
        } else if (dom.className !== cls) {
          dom.className = cls;
        }
        continue;
      }

      if (key === 'dangerouslySetInnerHTML') {
        const html = next?.__html ?? '';
        if (dom.innerHTML !== html) dom.innerHTML = html;
        continue;
      }

      if (key === 'value' && (dom._vtag === 'input' || dom._vtag === 'textarea' || dom._vtag === 'select')) {
        const strVal = next == null ? '' : String(next);
        if (dom.value !== strVal) {
          dom.value = strVal;
        }
        continue;
      }

      if (key === 'checked' && dom._vtag === 'input') {
        const boolVal = Boolean(next);
        if (dom.checked !== boolVal) {
          dom.checked = boolVal;
        }
        continue;
      }

      if (key === 'draggable') {
        dom.draggable = Boolean(next);
        if (next) dom.setAttribute('draggable', 'true');
        else dom.removeAttribute('draggable');
        continue;
      }

      if (BOOLEAN_ATTRS.has(key) && !isSvg) {
        const boolVal = Boolean(next);
        dom[key] = boolVal;
        if (boolVal) dom.setAttribute(key, '');
        else dom.removeAttribute(key);
        continue;
      }

      if (next === null || next === undefined || next === false) {
        dom.removeAttribute(key === 'htmlFor' ? 'for' : key);
      } else {
        const attrName = key === 'htmlFor' ? 'for' : key;
        const attrVal = next === true ? '' : String(next);
        if (dom.getAttribute(attrName) !== attrVal) {
          dom.setAttribute(attrName, attrVal);
        }
      }
    }
    dom._vprops = newProps;
  }

  function reconcileChildren(parentDom, newChildren, isSvg) {
    const existingNodes = Array.from(parentDom.childNodes);
    const keyedMap = new Map();
    const unkeyedList = [];

    for (let i = 0; i < existingNodes.length; i++) {
      const node = existingNodes[i];
      if (node._vkey != null) {
        keyedMap.set(node._vkey, node);
      } else {
        unkeyedList.push(node);
      }
    }

    let unkeyedIdx = 0;
    const usedNodes = new Set();
    const nextDomNodes = [];

    for (let i = 0; i < newChildren.length; i++) {
      const childVNode = newChildren[i];
      let matchedDom = null;

      if (childVNode.key != null) {
        const candidate = keyedMap.get(childVNode.key);
        if (candidate && candidate._vtag === childVNode.type) {
          matchedDom = candidate;
          keyedMap.delete(childVNode.key);
        }
      } else {
        while (unkeyedIdx < unkeyedList.length) {
          const candidate = unkeyedList[unkeyedIdx++];
          if (candidate && candidate._vtag === childVNode.type) {
            matchedDom = candidate;
            break;
          }
        }
      }

      if (matchedDom) {
        usedNodes.add(matchedDom);
        updateDomNode(matchedDom, childVNode, isSvg);
        nextDomNodes.push(matchedDom);
      } else {
        const created = createDomNode(childVNode, isSvg);
        usedNodes.add(created);
        nextDomNodes.push(created);
      }
    }

    // Remove unused old nodes
    for (let i = 0; i < existingNodes.length; i++) {
      const oldNode = existingNodes[i];
      if (!usedNodes.has(oldNode)) {
        parentDom.removeChild(oldNode);
      }
    }

    // Position nodes in order without touching nodes that are already in place
    for (let i = 0; i < nextDomNodes.length; i++) {
      const expectedNode = nextDomNodes[i];
      const currentNodeAtPos = parentDom.childNodes[i] || null;
      if (currentNodeAtPos !== expectedNode) {
        parentDom.insertBefore(expectedNode, currentNodeAtPos);
      }
    }
  }

  return rootObj;
}

const React = {
  createElement,
  Fragment,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createRoot
};

export default React;
