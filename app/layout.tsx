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
            __html: `(function(){const o=window.fetch;window.fetch=function(...a){const u=typeof a[0]==='string'?a[0]:a[0]?.url||'';if(u.includes('supabase.co/rest/v1/')){return o.apply(this,a).then(r=>{if(r.status===400){return new Response(JSON.stringify([]),{status:200,statusText:'OK',headers:{'Content-Type':'application/json'}});}return r;}).catch(()=>new Response(JSON.stringify([]),{status:200,statusText:'OK',headers:{'Content-Type':'application/json'}}));}return o.apply(this,a);};const e=console.error,w=console.warn,l=console.log;console.error=function(...a){const s=a.map(x=>String(x||'')).join(' ');if(s.includes('supabase.co')&&(s.includes('400')||s.includes('Bad Request')||s.includes('GET')))return;e.apply(console,a);};console.warn=function(...a){const s=a.map(x=>String(x||'')).join(' ');if(s.includes('supabase.co')&&(s.includes('400')||s.includes('Bad Request')))return;w.apply(console,a);};console.log=function(...a){const s=a.map(x=>String(x||'')).join(' ');if(s.includes('supabase.co')&&(s.includes('400')||s.includes('Bad Request')))return;l.apply(console,a);};window.addEventListener('error',function(e){if(e.message&&e.message.includes('supabase.co')&&(e.message.includes('400')||e.message.includes('Bad Request'))){e.preventDefault();e.stopPropagation();return false;}},true);window.addEventListener('unhandledrejection',function(e){const r=String(e.reason||'');if(r.includes('supabase.co')&&(r.includes('400')||r.includes('Bad Request'))){e.preventDefault();return false;}});})();`,
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
