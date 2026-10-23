import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';
import { CONFIG } from '@/lib/config';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
