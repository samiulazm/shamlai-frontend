import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Shamlai — Build Your Online Shop in 2 Clicks | E-commerce Platform",
  description: "Complete e-commerce solution for Bangladesh. Create a stunning storefront, manage products & orders, connect RedX/Pathao delivery, and automate customer support with AI. Start free!",
  keywords: ["e-commerce", "online store", "bangladesh", "shop builder", "delivery integration", "AI chatbot", "RedX", "Pathao", "online business"],
  authors: [{ name: "Shamlai" }],
  creator: "Shamlai",
  publisher: "Shamlai",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Shamlai — Build Your Online Shop in 2 Clicks",
    description: "Complete e-commerce platform for modern businesses. Launch in minutes, not months.",
    type: "website",
    locale: "en_US",
    siteName: "Shamlai",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Shamlai E-commerce Platform',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shamlai — Build Your Online Shop in 2 Clicks",
    description: "Complete e-commerce platform for modern businesses. Launch in minutes, not months.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Shamlai" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shamlai" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Analytics - Only in production */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          {/* Skip to main content for accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-indigo focus:text-white focus:rounded">
            Skip to main content
          </a>
          
          <div id="main-content">
            {children}
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
