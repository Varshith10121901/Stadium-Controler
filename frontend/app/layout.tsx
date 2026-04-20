import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwarmAI Bernabéu Edition — Decentralized Crowd Intelligence',
  description: 'Turn 80,000 phones into an AI swarm for Estadio Santiago Bernabéu. Reduce wait times by 40%, optimize crowd flow, and coordinate in real-time. Powered by Google Gemini AI.',
  keywords: ['SwarmAI', 'Bernabéu Edition', 'Santiago Bernabéu', 'crowd intelligence', 'stadium', 'multi-agent', 'decentralized AI', 'swarm', 'Google Gemini'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>S</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0a0e1a" />
      </head>
      <body className="bg-surface-0 text-white antialiased">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <main id="main-content" role="main" aria-label="SwarmAI Stadium Navigation">
          {children}
        </main>
      </body>
    </html>
  );
}
