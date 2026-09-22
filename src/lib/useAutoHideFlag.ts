import { useEffect, useRef, useState } from 'react';

/**
 * Vlag die na `durationMs` vanzelf weer verdwijnt. Gebruikt voor het
 * kortstondige "niet opgeslagen"-bannertje (optie 2 uit C6): nooit
 * blokkeren, alleen even laten merken dat iets niet is gelukt.
 */
export function useAutoHideFlag(durationMs: number): [boolean, () => void] {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), durationMs);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return [visible, show];
}
