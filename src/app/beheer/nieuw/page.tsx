import type { Metadata } from 'next';
import NieuwNestje from '../NieuwNestje';

export const metadata: Metadata = { title: 'Nieuw nestje', robots: { index: false } };

export default function NieuwPagina() {
  return <NieuwNestje />;
}
