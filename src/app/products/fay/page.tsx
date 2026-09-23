import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FaySource — Coming Soon',
  description: 'Verified Chinese manufacturers for African importers.',
};

export default function FaySourcePlaceholder() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        background: '#0b0b0b',
        color: '#f5f5f4',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.75rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#a3a3a3',
        }}
      >
        FaySource
      </p>
      <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>Coming soon.</h1>
      <p style={{ color: '#a3a3a3', maxWidth: 420 }}>
        Verified Chinese manufacturers for African importers. This is on its way — check back shortly.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '9999px',
          padding: '0.75rem 1.5rem',
          textDecoration: 'none',
          color: 'inherit',
          fontSize: '0.9rem',
        }}
      >
        ← Back home
      </Link>
    </main>
  );
}
