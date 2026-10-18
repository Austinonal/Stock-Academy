import { useCallback, useEffect, useRef, useState } from 'react';
import { getItem, setItem } from './db';

/**
 * State backed by IndexedDB. `validate` guards against corrupted/old data: if it fails, the default is used
 * and `error` explains why, instead of crashing the page.
 */
export function usePersistent<T>(key: string, initial: T, validate: (v: unknown) => v is T = (v): v is T => v !== undefined) {
  const [value, setValue] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = useRef(value);
  const initialRef = useRef(initial);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getItem<unknown>(key)
      .then((v) => {
        if (!alive) return;
        if (v === undefined) { current.current = initialRef.current; setValue(initialRef.current); }
        else if (validate(v)) { current.current = v; setValue(v); }
        else { setError('ข้อมูลที่บันทึกไว้เสียหายหรือรูปแบบเก่า จึงใช้ค่าเริ่มต้นแทน'); current.current = initialRef.current; setValue(initialRef.current); }
      })
      .catch(() => alive && setError('อ่านข้อมูลจากเครื่องไม่ได้'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate is a stable type guard per call site; reload only when key changes
  }, [key]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    const v = typeof next === 'function' ? (next as (p: T) => T)(current.current) : next;
    current.current = v;
    setValue(v);
    setItem(key, v).catch(() => setError('บันทึกข้อมูลไม่สำเร็จ — พื้นที่เก็บข้อมูลอาจเต็มหรือถูกบล็อก'));
  }, [key]);

  return [value, update, { loading, error }] as const;
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
