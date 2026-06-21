'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the user has requested reduced motion via the OS/browser.
 * Updates live if the preference changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);

    // Safari < 14 fallback
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } else {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);

  return reduced;
}

export default useReducedMotion;
