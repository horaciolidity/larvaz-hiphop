import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://larvaz-hiphop.vercel.app'),
  title: 'LARVAZ HIPHOP — Red Social y Muro Digital de Cultura Urbana',
  description: 'Comunidad digital de cultura hip-hop. Todos los elementos en un solo muro compartido: MC, DJ, Breaking, Graffiti y Beatmaking. ¡Únete al cypher!',
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: 'Larvaz Hip-Hop',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/icons/icon-192.png'],
  },
  openGraph: {
    title: 'LARVAZ HIPHOP — Red Social y Muro Digital de Cultura Urbana',
    description: 'La movida hip-hop en un solo muro abierto. Radio 24/7 de rap y trap, barras, cyphers, graffiti y beatmaking. Súmate a la cultura.',
    url: 'https://larvaz-hiphop.vercel.app',
    siteName: 'LARVAZ HIPHOP',
    images: [
      {
        url: '/og-larvaz.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'LARVAZ HIP HOP — logotipo dorado con corona y micrófono sobre fondo negro',
      },
    ],
    locale: 'es_LA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LARVAZ HIPHOP — La Casa de la Cultura Urbana',
    description: 'Muro digital abierto para MCs, DJs, B-boys y Escritores de Graffiti. Radio 24/7 y comunidad activa.',
    images: [
      {
        url: '/og-larvaz.jpg',
        width: 1200,
        height: 630,
        alt: 'LARVAZ HIP HOP — logotipo dorado con corona y micrófono',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#C6FF00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-background text-content-primary antialiased min-h-screen" suppressHydrationWarning>
        <AppProvider>
          <AppLayout>{children}</AppLayout>
        </AppProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration skipped or error:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
