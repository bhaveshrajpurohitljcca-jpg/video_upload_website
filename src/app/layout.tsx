import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/navbar';
import { ToastContainer } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'AI Powered Content Creators Bootcamp | College AI Video Competition',
  description: 'Submit, watch, and score state-of-the-art college AI generated short videos. Participate in the bootcamp competition and vote for your favorite themes.',
  keywords: ['AI Video', 'College Competition', 'AI Art', 'Submissions', 'Gallery', 'Video Bootcamp', 'Content Creators'],
  authors: [{ name: 'AI Powered Content Creators Committee' }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <footer className="border-t border-white/5 bg-background py-8 text-center text-xs text-zinc-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
              <p>&copy; {new Date().getFullYear()} AI Powered Content Creators Bootcamp. All rights reserved. Created for College AI Video Innovation Competition.</p>
              <p className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-wide uppercase">
                Created By Bhavesh Rajpurohit
              </p>
            </div>
          </footer>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
