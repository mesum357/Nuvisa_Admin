import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import SessionProvider from '@/providers/SessionProvider';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className}`} suppressHydrationWarning>
        <SessionProvider session={session}>
          <SidebarProvider>{children}</SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
