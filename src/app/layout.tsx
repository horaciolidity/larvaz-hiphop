import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'LARVAZ HIPHOP — Red Social y Muro Digital de Cultura Urbana',
  description: 'Comunidad digital de cultura hip-hop. Todos los elementos en un solo muro compartido: MC, DJ, Breaking, Graffiti y Beatmaking.',
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
