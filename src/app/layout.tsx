import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ToastProvider } from '@/components/Toast';
import { CONFIG } from '@/lib/config';
import Meting from '@/components/Meting';
import SiteKop from '@/components/SiteKop';
import './globals.css';
import './sitekop.css';

// Het lettertype staat in het project zelf (src/app/fonts), zodat de build niet afhangt van Google Fonts.
const bricolage = localFont({
  src: './fonts/bricolage-grotesque.woff2',
  weight: '200 800',
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.siteUrl),
  title: { default: 'Nestje: één pagina voor je nestje kittens', template: '%s | Nestje' },
  description: 'Maak in een paar minuten een deelbare pagina voor je nestje kittens. Gratis, op je telefoon.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEF1EC' },
    { media: '(prefers-color-scheme: dark)', color: '#151B17' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={bricolage.variable}>
      <body>
        <ToastProvider>
          <SiteKop />
          {children}
        </ToastProvider>
        <Meting />
      </body>
    </html>
  );
}
