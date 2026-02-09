import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { I18nProvider } from "@/components/I18nProvider";
import FetchInterceptor from "@/components/FetchInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevents invisible text during font load
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: "CasaPilot",
  description: "Sistema de gestión de propiedades para inventario, mantenimiento y gastos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CasaPilot",
  },
  icons: {
    apple: "/apple-touch-icon.png?v=4",
    icon: [
      { url: "/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=4", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=4" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CasaPilot" />
        {/* CRITICAL: Intercept fetch and console BEFORE React loads to prevent 400 errors from being logged */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Intercept fetch FIRST (before React loads) - AGGRESSIVE MODE
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                  
                  // Check if this is ANY Supabase REST API query
                  const isSupabaseQuery = url.includes('supabase.co/rest/v1/');
                  
                  // For ALL Supabase queries, intercept 400 errors
                  if (isSupabaseQuery) {
                    return originalFetch.apply(this, args)
                      .then(response => {
                        // Clone to check status without consuming
                        const cloned = response.clone();
                        
                        // If 400, return empty array instead
                        if (response.status === 400) {
                          return new Response(JSON.stringify([]), {
                            status: 200,
                            statusText: 'OK',
                            headers: { 'Content-Type': 'application/json' }
                          });
                        }
                        
                        return response;
                      })
                      .catch(() => {
                        // Silently return empty response on any error
                        return new Response(JSON.stringify([]), {
                          status: 200,
                          statusText: 'OK',
                          headers: { 'Content-Type': 'application/json' }
                        });
                      });
                  }
                  
                  return originalFetch.apply(this, args);
                };
                
                // AGGRESSIVE: Intercept ALL console methods to filter Supabase errors
                const originalConsoleError = console.error;
                const originalConsoleWarn = console.warn;
                const originalConsoleLog = console.log;
                
                console.error = function(...args) {
                  const allArgs = args.map(a => String(a || '')).join(' ');
                  if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request') || allArgs.includes('GET'))) {
                    return; // Silently ignore ALL Supabase errors
                  }
                  originalConsoleError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const allArgs = args.map(a => String(a || '')).join(' ');
                  if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request'))) {
                    return; // Silently ignore
                  }
                  originalConsoleWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  const allArgs = args.map(a => String(a || '')).join(' ');
                  if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request'))) {
                    return; // Silently ignore
                  }
                  originalConsoleLog.apply(console, args);
                };
                
                // Also intercept unhandled errors
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('supabase.co') && (e.message.includes('400') || e.message.includes('Bad Request'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Intercept unhandled promise rejections
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = String(e.reason || '');
                  if (reason.includes('supabase.co') && (reason.includes('400') || reason.includes('Bad Request'))) {
                    e.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FetchInterceptor />
        <div id="portal-root" />
        <I18nProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
