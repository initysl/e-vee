import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import SessionGuard from '@/components/SessionGuard';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://e-vee.vercel.app'),

  title: {
    default: 'E-vee',
    template: '%s | E-vee',
  },

  description:
    'E-vee is a RAG-powered shopping assistant that helps you discover, compare, and buy products smarter.',

  applicationName: 'E-vee',

  keywords: [
    'AI shopping assistant',
    'RAG ecommerce',
    'AI product discovery',
    'shopping chatbot',
    'product recommendations',
  ],

  authors: [{ name: 'Yusuf Lawal' }],
  creator: 'Yusuf Lawal',
  publisher: 'E-vee',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  openGraph: {
    type: 'website',
    url: 'https://e-vee.vercel.app',
    title: 'E-vee',
    description:
      'Shop products smarter with E-vee, a RAG-powered shopping assistant.',
    siteName: 'E-vee',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'E-vee - AI Shopping Assistant',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'E-vee',
    description:
      'Shop products smarter with E-vee, a RAG-powered shopping assistant.',
    images: ['/og-image.png'],
    creator: '@initysl',
    site: '@initysl',
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionGuard>
          <CartProvider>{children}</CartProvider>
        </SessionGuard>
        <Analytics />
      </body>
    </html>
  );
}
