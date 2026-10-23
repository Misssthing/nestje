'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext<(tekst: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [tekst, setTekst] = useState('');
  const [zichtbaar, setZichtbaar] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toon = useCallback((t: string) => {
    setTekst(t);
    setZichtbaar(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setZichtbaar(false), 2000);
  }, []);

  return (
    <ToastCtx.Provider value={toon}>
      {children}
      <div className={`toast${zichtbaar ? ' show' : ''}`} role="status" aria-live="polite">
        {tekst}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
