const links = [
  {
    href: '/ebook/landed',
    label: 'Ebook',
    description: 'Landed — the China sourcing field guide by FayFay.',
  },
  {
    href: '/products/fay',
    label: 'FaySource',
    description: 'Verified Chinese manufacturers for African importers.',
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.5rem',
        padding: '2rem',
        background: '#0b0b0b',
        color: '#f5f5f4',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#a3a3a3',
          }}
        >
          Fayfort International Trading
        </p>
        <h1 style={{ margin: '0.75rem 0 0', fontSize: '2rem', fontWeight: 600 }}>
          Choose where you&apos;re headed.
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#a3a3a3', maxWidth: 420 }}>
          This is a temporary hub while the main site is being put together.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1rem',
          width: '100%',
          maxWidth: 640,
        }}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              flex: '1 1 260px',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textDecoration: 'none',
              color: 'inherit',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 600 }}>
              {link.label}
            </span>
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#a3a3a3', fontSize: '0.9rem' }}>
              {link.description}
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
