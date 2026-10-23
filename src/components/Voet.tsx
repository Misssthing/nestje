import Link from 'next/link';
import { CONFIG } from '@/lib/config';

export default function Voet() {
  return (
    <footer className="voet">
      <span>
        Gemaakt met <Link href="/">Nestje</Link> van{' '}
        <a href={CONFIG.moederSiteUrl}>kattenverzorging.com</a>
      </span>
      <Link href="/privacy">Privacy</Link>
      <Link href="/voorwaarden">Voorwaarden</Link>
    </footer>
  );
}
