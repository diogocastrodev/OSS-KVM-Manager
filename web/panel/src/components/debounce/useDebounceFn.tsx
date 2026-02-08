import { useEffect, useMemo, useRef } from "react";

type DebouncedFn<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 300,
): DebouncedFn<TArgs> {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useMemo(() => {
    const d = ((...args: TArgs) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    }) as DebouncedFn<TArgs>;

    d.cancel = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };

    return d;
  }, [delay]);

  // Optional: cancel pending call on unmount
  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}
