import './globals.css';

export const metadata = {
  title: 'Task Orbit | Spin Your Productivity',
  description: 'A powerful task management wheel with integrated timers and batch import.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎡</text></svg>",
  },
  openGraph: {
    type: 'website',
    title: 'Task Orbit',
    description: 'Decide your next task with a spin.',
    images: ['https://picsum.photos/seed/taskorbit/1200/630'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
