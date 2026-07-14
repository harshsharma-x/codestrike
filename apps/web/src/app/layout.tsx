import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeStrike AI',
  description: 'Open-source AI-powered coding assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
