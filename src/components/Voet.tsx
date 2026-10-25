import Link from 'next/link';
import { CONFIG, metUtm } from '@/lib/config';

export default function Voet() {
  return (
    <footer className="voet">
      <span>
        Gemaakt met <Link href="/">Nestje</Link> van{' '}
        <a href={metUtm(CONFIG.moederSiteUrl, 'voet')}>kattenverzorging.com</a>
      </span>
      <Link href="/kittens">Kittens te koop</Link>
      <Link href="/hulp">Hulp</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/voorwaarden">Voorwaarden</Link>
    </footer>
  );
}
