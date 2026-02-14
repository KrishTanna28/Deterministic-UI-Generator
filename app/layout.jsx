import './globals.css';

export const metadata = {
  title: 'Deterministic UI Generator',
  description: 'AI Agent that converts natural language into working React UI using a fixed component system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
