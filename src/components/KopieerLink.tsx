'use client';

import { useToast } from './Toast';

export default function KopieerLink({ url, className = 'btn ghost' }: { url: string; className?: string }) {
  const toast = useToast();

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link gekopieerd');
    } catch {
      // Oudere browsers: valt terug op het deelmenu van de telefoon
      if (navigator.share) {
        try {
          await navigator.share({ url });
        } catch {}
      } else {
        toast('Kopiëren lukt niet, houd de link ingedrukt om te kopiëren');
      }
    }
  }

  return (
    <button type="button" className={className} onClick={kopieer}>
      Link kopiëren
    </button>
  );
}
