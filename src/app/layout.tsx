import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import SessionProvider from '@/providers/SessionProvider';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className}`}>
        <SessionProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
