import { useState, useEffect } from 'react';

const BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT : false
  );

  useEffect(() => {
    let timeoutId;
    const handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < BREAKPOINT);
      }, 150);
    };
    window.addEventListener('resize', handler);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handler);
    };
  }, []);

  return isMobile;
}
