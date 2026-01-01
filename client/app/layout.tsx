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
  title: {
    default: 'E-vee',
    template: '%s | E-vee',
  },
  description:
    'E-vee is a RAG-powered shopping assistant chatbot that helps users discover and purchase products.',
  applicationName: 'E-vee',
  keywords: [
    'Chatbot shopping assistant',
    'RAG ecommerce',
    'AI ecommerce',
    'shopping assistant',
    'product recommendations',
  ],
  authors: [{ name: 'Yusuf' }],
  creator: 'E-vee',
  metadataBase: new URL('https://e-vee.vercel.app'),

  openGraph: {
    title: 'E-vee',
    description:
      'Shop products smarter with E-vee, a RAG-powered shopping assistant chatbot.',
    url: 'https://e-vee.vercel.app',
    siteName: 'E-vee',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'E-vee',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'E-vee',
    description:
      'Shop products smarter with E-vee, a RAG-powered shopping assistant chatbot.',
    images: ['https://yusola.vercel.app/og-image.jpg'],
    creator: '@initysl',
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  robots: {
    index: true,
    follow: true,
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
