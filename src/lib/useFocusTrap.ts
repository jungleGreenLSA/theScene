'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps keyboard focus inside `containerRef` while `open` is true.
 * - Moves focus into the container on open.
 * - Cycles Tab / Shift+Tab within focusable descendants.
 * - Calls `onClose` on Escape.
 * - Restores focus to the previously-focused element on close/unmount.
 */
export function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void,
): void {
  useEffect(() => {
    if (!open) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Move focus into the container.
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      // Ensure the container itself can receive focus.
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      container.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [open, containerRef, onClose]);
}

export default useFocusTrap;
