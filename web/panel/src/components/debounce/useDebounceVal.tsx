import { useEffect, useState } from "react";

export function useDebounceVal<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // cleanup cancels the pending update
  }, [value, delay]);

  return debounced;
}
