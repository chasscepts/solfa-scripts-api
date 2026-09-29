// snapshot.js
const defaultOptions = {
  maxArrayLength: 200,
  maxDepth: 6,
  maxKeys: 200,
  maxStringLength: 4000,
  maxTotalNodes: 20000,
  includeNonEnumerable: false,
  includeSymbols: true,
  includeGetters: false, // getters may have side effects / throw
  treatBufferAs: 'base64', // 'base64' | 'hex' | 'omit'
};

const isPlainObject = (v) => Object.prototype.toString.call(v) === '[object Object]';

const safeToString = (v) => {
  try {
    return String(v);
  } catch {
    return '[Unstringifiable]';
  }
};

const safeGetOwnPropertyNames = (obj, includeNonEnumerable) => {
  try {
    return includeNonEnumerable ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
  } catch {
    return [];
  }
};

const safeGetOwnPropertySymbols = (obj) => {
  try {
    return Object.getOwnPropertySymbols(obj);
  } catch {
    return [];
  }
};

const safeGetDescriptor = (obj, key) => {
  try {
    return Object.getOwnPropertyDescriptor(obj, key);
  } catch {
    return null;
  }
};

const safeReadValue = (obj, key, includeGetters) => {
  const desc = safeGetDescriptor(obj, key);
  if (!desc) return { ok: false, error: 'descriptor_unavailable' };

  if ('value' in desc) {
    return { ok: true, value: desc.value, kind: 'value' };
  }

  // accessor
  if (!includeGetters) {
    return { ok: true, value: { __type: 'Getter', __note: 'getter not invoked' }, kind: 'getter_skipped' };
  }

  try {
    // invoke getter
    // eslint-disable-next-line no-unused-expressions
    const val = obj[key];
    return { ok: true, value: val, kind: 'getter' };
  } catch (e) {
    return { ok: false, error: 'getter_threw', thrown: e };
  }
};

const encodeBuffer = (buf, treatBufferAs) => {
  if (treatBufferAs === 'omit') return { __type: 'Buffer', __note: 'omitted' };
  if (treatBufferAs === 'hex') return { __type: 'Buffer', encoding: 'hex', data: buf.toString('hex') };
  return { __type: 'Buffer', encoding: 'base64', data: buf.toString('base64') };
};

export const snapshotProps = (input, opts = {}) => {
  const options = { ...defaultOptions, ...opts };

  const seen = new WeakMap(); // object -> id
  let nextId = 1;

  const meta = {
    errors: [],
    nodes: 0,
    truncated: false,
    truncatedPaths: [],
  };

  const markTruncated = (path, reason) => {
    meta.truncated = true;
    meta.truncatedPaths.push({ path, reason });
  };

  const typeOf = (v) => {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  };

  const visit = (value, path, depth) => {
    meta.nodes += 1;
    if (meta.nodes > options.maxTotalNodes) {
      markTruncated(path, 'maxTotalNodes');

      return { __type: 'Truncated', reason: 'maxTotalNodes' };
    }

    const t = typeOf(value);

    // primitives
    if (t === 'null') return null;
    if (t === 'undefined') return { __type: 'Undefined' };
    if (t === 'string') {
      if (value.length > options.maxStringLength) {
        markTruncated(path, 'maxStringLength');
        return { __type: 'String', truncated: true, value: value.slice(0, options.maxStringLength) };
      }
      return value;
    }
    if (t === 'number') {
      if (Number.isNaN(value)) return { __type: 'Number', value: 'NaN' };
      if (value === Infinity) return { __type: 'Number', value: 'Infinity' };
      if (value === -Infinity) return { __type: 'Number', value: '-Infinity' };
      return value;
    }
    if (t === 'boolean') return value;
    if (t === 'bigint') return { __type: 'BigInt', value: value.toString() };
    if (t === 'symbol') return { __type: 'Symbol', value: value.description ?? null };
    if (t === 'function') {
      return {
        __type: 'Function',
        name: value.name || null,
        length: value.length,
        // Avoid storing full source by default; it may be huge or sensitive.
      };
    }
    if (value?.toString && typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      try {
        const str = value.toString();
        if (typeof str === 'string' && str !== '[object Object]') {
          return { __type: 'ObjectWithCustomToString', value: str };
        }
      } catch {
        // ignore
      }
    }

    // objects
    if (depth >= options.maxDepth) {
      markTruncated(path, 'maxDepth');
      return { __type: 'Truncated', reason: 'maxDepth', summary: safeToString(value) };
    }

    // circular refs
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      if (seen.has(value)) {
        return { __ref: seen.get(value) };
      }
      const id = nextId++;
      seen.set(value, id);

      // special cases
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        return { __id: id, ...encodeBuffer(value, options.treatBufferAs) };
      }

      if (value instanceof Date) {
        return { __id: id, __type: 'Date', value: value.toISOString() };
      }

      if (value instanceof RegExp) {
        return { __id: id, __type: 'RegExp', source: value.source, flags: value.flags };
      }

      if (value instanceof Error) {
        return {
          __id: id,
          __type: 'Error',
          name: value.name,
          message: value.message,
          stack: typeof value.stack === 'string' ? value.stack.slice(0, options.maxStringLength) : null
        };
      }

      if (value instanceof Map) {
        const entries = [];
        let i = 0;
        for (const [k, v] of value.entries()) {
          if (i >= options.maxKeys) {
            markTruncated(path, 'maxKeys(Map)');
            break;
          }
          entries.push([visit(k, `${path}.<mapKey${i}>`, depth + 1), visit(v, `${path}.<mapVal${i}>`, depth + 1)]);
          i += 1;
        }
        return { __id: id, __type: 'Map', entries };
      }

      if (value instanceof Set) {
        const values = [];
        let i = 0;
        for (const v of value.values()) {
          if (i >= options.maxKeys) {
            markTruncated(path, 'maxKeys(Set)');
            break;
          }
          values.push(visit(v, `${path}.<set${i}>`, depth + 1));
          i += 1;
        }
        return { __id: id, __type: 'Set', values };
      }

      if (Array.isArray(value)) {
        const out = [];
        const len = Math.min(value.length, options.maxArrayLength);
        for (let i = 0; i < len; i += 1) {
          out.push(visit(value[i], `${path}[${i}]`, depth + 1));
        }
        if (value.length > options.maxArrayLength) {
          markTruncated(path, 'maxArrayLength');
          return { __id: id, __type: 'Array', truncated: true, length: value.length, items: out };
        }
        return { __id: id, __type: 'Array', items: out };
      }

      // general object
      const out = {
        __id: id,
        __type: isPlainObject(value) ? 'Object' : (value?.constructor?.name || 'Object')
      };

      const keys = safeGetOwnPropertyNames(value, options.includeNonEnumerable);
      const symKeys = options.includeSymbols ? safeGetOwnPropertySymbols(value) : [];

      const allKeys = [...keys, ...symKeys];
      const limitedKeys = allKeys.slice(0, options.maxKeys);

      if (allKeys.length > options.maxKeys) {
        markTruncated(path, 'maxKeys(Object)');
      }

      for (const k of limitedKeys) {
        const keyName = typeof k === 'symbol' ? `Symbol(${k.description ?? ''})` : k;

        const read = safeReadValue(value, k, options.includeGetters);
        if (!read.ok) {
          meta.errors.push({
            path: `${path}.${keyName}`,
            error: read.error,
            thrown: read.thrown ? { name: read.thrown.name, message: read.thrown.message } : undefined
          });
          out[keyName] = { __type: 'Unreadable', reason: read.error };
          continue;
        }

        out[keyName] = visit(read.value, `${path}.${keyName}`, depth + 1);
      }

      return out;
    }

    // fallback
    return { __type: 'Unknown', value: safeToString(value) };
  };

  const snapshot = visit(input, '$', 0);

  return { meta, snapshot };
};
