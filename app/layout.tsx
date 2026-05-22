import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import StorageCleanup from './storage-cleanup';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Andwell Innovation Command Center',
  description: 'Competitive intelligence, growth planning, staffing, and board-ready strategy for Andwell Health Partners.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <StorageCleanup />
        {children}
      </body>
    </html>
  );
}
