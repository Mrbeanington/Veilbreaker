import { useLayoutEffect, useState } from "react";

/** The height of the sticky main navigation, so a bar can sit exactly under it whatever the text size is. */
export function useNavHeight(): number {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>(".main-nav");
    if (!nav) return;
    const measure = () => setTop(nav.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  return top;
}
