import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GIG4U - Work Orchestration Platform',
  description:
    'GIG4U connects clients with service providers for seamless work orchestration.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
