import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yamaha ExpVoice Studio | PPI to PPF & YEP File Converter",
  description:
    "Professional Yamaha Expansion Voice file converter system. Convert compiled PPI packages into editable PPF project archives or legacy YEP files.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExpVoice Studio",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Telegram WebApp script for Mini App support */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        {/* Immediate Theme Initializer to prevent light/dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var isDark = saved !== null ? saved === 'dark' : true;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration note:', err.message);
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
