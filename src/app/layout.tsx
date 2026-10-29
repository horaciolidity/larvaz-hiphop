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
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Larvaz Hip-Hop',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
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
        alt: 'Comunidad Urbana Larvaz Hip-Hop - Cypher y Encuentro de Cultura Callejera',
      },
    ],
    locale: 'es_LA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LARVAZ HIPHOP — La Casa de la Cultura Urbana',
    description: 'Muro digital abierto para MCs, DJs, B-boys y Escritores de Graffiti. Radio 24/7 y comunidad activa.',
    images: ['/og-larvaz.jpg'],
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
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <meta property="og:image" content="/og-larvaz.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="/og-larvaz.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="bg-background text-content-primary antialiased min-h-screen">
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
