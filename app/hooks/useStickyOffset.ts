import { useLayoutEffect, useRef, useState } from 'react';

// Measures an element's current height (kept up to date via ResizeObserver) so a
// second sticky element below it can pin right under it instead of at the very
// top. Returns a ref to attach to the upper element and its live height in px.
export function useStickyOffset<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height };
}
