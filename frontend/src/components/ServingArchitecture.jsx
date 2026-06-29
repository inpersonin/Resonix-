export default function ServingArchitecture() {
  const nodes = [
    {
      label: 'React Frontend',
      sub: 'Vite + TailwindCSS',
      icon: '⬡',
      active: false,
    },
    {
      label: 'FastAPI',
      sub: 'HF Spaces · Docker',
      icon: '⚡',
      active: true,
    },
    {
      label: 'Recommender.py',
      sub: 'In-Memory Store',
      icon: '♦',
      active: false,
      log: true,
    },
  ];

  return (
    <div className="arch-section">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <span className="section-icon">⌥</span>
        <h2 className="section-title">Serving Architecture</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {nodes.map((n, i) => (
          <div key={n.label} style={{ width: '100%', maxWidth: 400 }}>
            <div className={`arch-node${n.active ? ' active' : ''}`}>
              <span style={{ marginRight: '0.5rem', opacity: 0.7 }}>{n.icon}</span>
              {n.label}
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Space Mono', marginTop: '0.15rem' }}>
                {n.sub}
              </div>
            </div>

            {n.log && (
              <div className="arch-log-box">
                <div>▸ loading CB matrix (85k × 50)</div>
                <div>▸ loading NCF weights (pytorch)</div>
                <div>▸ ready — 85,343 tracks indexed</div>
              </div>
            )}

            {i < nodes.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="arch-connector" />
              </div>
            )}
          </div>
        ))}

        {/* CB + NCF split */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="arch-connector" />
        </div>

        <div className="arch-split" style={{ width: '100%', maxWidth: 400 }}>
          <div className="arch-node" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--green-accent)', fontWeight: 700, marginBottom: '0.2rem' }}>CB Matrix</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Dim: 85k × 50</div>
          </div>
          <div className="arch-node" style={{ textAlign: 'center' }}>
            <div style={{ color: '#78b9ff', fontWeight: 700, marginBottom: '0.2rem' }}>NCF Embedder</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Dim: 20k × 255</div>
          </div>
        </div>
      </div>
    </div>
  );
}
