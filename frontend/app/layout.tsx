import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwarmAI — Decentralized Crowd Intelligence for Stadiums',
  description: 'Turn 80,000 phones into an AI swarm. Reduce wait times by 40%, optimize crowd flow, and coordinate in real-time using decentralized multi-agent intelligence.',
  keywords: ['SwarmAI', 'crowd intelligence', 'stadium', 'multi-agent', 'decentralized AI', 'swarm'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐝</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0e1a" />
      </head>
      <body className="bg-surface-0 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
