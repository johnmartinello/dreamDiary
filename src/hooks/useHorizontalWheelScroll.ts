import { useEffect } from 'react';

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

const findHorizontalScrollableAncestor = (target: HTMLElement | null): HTMLElement | null => {
  let current: HTMLElement | null = target;

  while (current) {
    const computedStyle = window.getComputedStyle(current);
    const canScrollHorizontally =
      SCROLLABLE_OVERFLOW_VALUES.has(computedStyle.overflowX) &&
      current.scrollWidth > current.clientWidth + 1;

    if (canScrollHorizontally) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export function useHorizontalWheelScroll() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const horizontalDelta = Math.abs(event.deltaX) > 0 ? event.deltaX : 0;
      const shiftHorizontalDelta =
        horizontalDelta === 0 && event.shiftKey && Math.abs(event.deltaY) > 0 ? event.deltaY : 0;
      const delta = horizontalDelta || shiftHorizontalDelta;

      if (delta === 0) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      const scrollableElement = findHorizontalScrollableAncestor(target);
      if (!scrollableElement) {
        return;
      }

      const previousScrollLeft = scrollableElement.scrollLeft;
      scrollableElement.scrollLeft += delta;

      if (scrollableElement.scrollLeft !== previousScrollLeft) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);
}
