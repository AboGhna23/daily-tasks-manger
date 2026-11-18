import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Minimal TSX -> JS pipeline (JSX to React.createElement, then Node's built-in type stripping).
// Shared by the dev server and the Electron web build.

export function transformJSX(source) {
  let i = 0;
  const len = source.length;

  function isIdentStart(ch) {
    return Boolean(ch) && /[A-Za-z_$]/.test(ch);
  }
  function isIdentChar(ch) {
    return Boolean(ch) && /[A-Za-z0-9_$.-]/.test(ch);
  }

  function parseCode(stopOnCloseBrace = false) {
    let out = '';
    let braceDepth = 0;
    let lastNonSpace = '';

    while (i < len) {
      const ch = source[i];

      if (ch === '/' && source[i + 1] === '/') {
        const start = i;
        while (i < len && source[i] !== '\n') i++;
        out += source.slice(start, i);
        continue;
      }

      if (ch === '/' && source[i + 1] === '*') {
        const start = i;
        i += 2;
        while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i++;
        i += 2;
        out += source.slice(start, i);
        continue;
      }

      if (ch === '"' || ch === "'") {
        out += readString(ch);
        lastNonSpace = ch;
        continue;
      }

      if (ch === '`') {
        out += readTemplateLiteral();
        lastNonSpace = '`';
        continue;
      }

      if (ch === '{') {
        braceDepth++;
        out += ch;
        i++;
        lastNonSpace = '{';
        continue;
      }

      if (ch === '}') {
        if (stopOnCloseBrace && braceDepth === 0) {
          return out;
        }
        braceDepth--;
        out += ch;
        i++;
        lastNonSpace = '}';
        continue;
      }

      if (ch === '<') {
        const next = source[i + 1];
        const canStartJSX =
          lastNonSpace === '' ||
          /[=({[,;:?&|!~+\-*\/^%>]/.test(lastNonSpace) ||
          /\b(?:return|case|default|throw|yield|await|as|else)\s*$/.test(out);

        if (canStartJSX && (next === '>' || isIdentStart(next))) {
          out += parseJSXElement();
          lastNonSpace = ')';
          continue;
        }
      }

      if (!/\s/.test(ch)) {
        lastNonSpace = ch;
      }
      out += ch;
      i++;
    }
    return out;
  }

  function readString(quote) {
    let s = quote;
    i++;
    while (i < len) {
      const c = source[i++];
      s += c;
      if (c === '\\' && i < len) {
        s += source[i++];
      } else if (c === quote) {
        break;
      }
    }
    return s;
  }

  function readTemplateLiteral() {
    let s = '`';
    i++;
    while (i < len) {
      const c = source[i];
      if (c === '\\') {
        s += source[i++] + (source[i++] || '');
      } else if (c === '$' && source[i + 1] === '{') {
        s += '${';
        i += 2;
        s += parseCode(true);
        if (source[i] === '}') {
          s += '}';
          i++;
        }
      } else if (c === '`') {
        s += '`';
        i++;
        break;
      } else {
        s += c;
        i++;
      }
    }
    return s;
  }

  function skipWhitespace() {
    while (i < len && /\s/.test(source[i])) i++;
  }

  function parseJSXElement() {
    i++; // consume '<'
    if (source[i] === '>') {
      i++; // consume '>'
      const children = parseJSXChildren('');
      return `React.createElement(React.Fragment, null${children.length ? ', ' + children.join(', ') : ''})`;
    }

    let tagName = '';
    while (i < len && isIdentChar(source[i])) {
      tagName += source[i++];
    }

    const isIntrinsic = /^[a-z]/.test(tagName);
    const tagExpr = isIntrinsic ? JSON.stringify(tagName) : tagName;

    const props = [];
    while (i < len) {
      skipWhitespace();
      if (source[i] === '/' && source[i + 1] === '>') {
        i += 2;
        const propsExpr = buildPropsExpr(props);
        return `React.createElement(${tagExpr}, ${propsExpr})`;
      }
      if (source[i] === '>') {
        i++;
        break;
      }
      if (source[i] === '{') {
        i++;
        skipWhitespace();
        if (source.slice(i, i + 3) === '...') {
          i += 3;
          const expr = parseCode(true);
          if (source[i] === '}') i++;
          props.push({ spread: true, expr });
          continue;
        }
      }

      let attrName = '';
      while (i < len && /[A-Za-z0-9_:-]/.test(source[i])) {
        attrName += source[i++];
      }
      if (!attrName) {
        i++;
        continue;
      }
      skipWhitespace();
      if (source[i] === '=') {
        i++;
        skipWhitespace();
        if (source[i] === '"' || source[i] === "'") {
          const val = readString(source[i]);
          props.push({ key: attrName, val });
        } else if (source[i] === '{') {
          i++;
          const expr = parseCode(true);
          if (source[i] === '}') i++;
          props.push({ key: attrName, val: `(${expr})` });
        }
      } else {
        props.push({ key: attrName, val: 'true' });
      }
    }

    const children = parseJSXChildren(tagName);
    const propsExpr = buildPropsExpr(props);
    return `React.createElement(${tagExpr}, ${propsExpr}${children.length ? ', ' + children.join(', ') : ''})`;
  }

  function buildPropsExpr(props) {
    if (props.length === 0) return 'null';
    const hasSpread = props.some((p) => p.spread);
    if (!hasSpread) {
      const pairs = props.map((p) => `${JSON.stringify(p.key)}: ${p.val}`);
      return `{ ${pairs.join(', ')} }`;
    }
    const parts = props.map((p) =>
      p.spread ? p.expr : `{ ${JSON.stringify(p.key)}: ${p.val} }`
    );
    return `Object.assign({}, ${parts.join(', ')})`;
  }

  function parseJSXChildren() {
    const children = [];
    let textBuf = '';

    function flushText() {
      if (!textBuf) return;
      const lines = textBuf.split(/\r?\n/);
      if (lines.length > 1) {
        const cleaned = lines
          .map((line, idx) => {
            let s = line;
            if (idx > 0) s = s.replace(/^\s+/, '');
            if (idx < lines.length - 1) s = s.replace(/\s+$/, '');
            return s;
          })
          .filter((s) => s.length > 0)
          .join(' ');
        if (cleaned) {
          children.push(JSON.stringify(cleaned));
        }
      } else {
        children.push(JSON.stringify(textBuf));
      }
      textBuf = '';
    }

    while (i < len) {
      if (source[i] === '<' && source[i + 1] === '/') {
        flushText();
        i += 2;
        while (i < len && source[i] !== '>') i++;
        i++;
        break;
      }
      if (source[i] === '<' && (source[i + 1] === '>' || isIdentStart(source[i + 1]))) {
        flushText();
        children.push(parseJSXElement());
        continue;
      }
      if (source[i] === '{') {
        flushText();
        i++;
        const expr = parseCode(true).trim();
        if (source[i] === '}') i++;
        if (expr && !/^\/\*[\s\S]*\*\/$/.test(expr)) {
          children.push(expr);
        }
        continue;
      }
      textBuf += source[i++];
    }
    return children;
  }

  return parseCode(false);
}

export function compileTSModule(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const withJSX = filePath.endsWith('.tsx') ? transformJSX(raw) : raw;
  const js = stripTypeScriptTypes(withJSX);
  return js;
}

