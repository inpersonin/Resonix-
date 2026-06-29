import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import CustomCursor from './components/CustomCursor';
import AudioWaveform from './components/AudioWaveform';
import ServingArchitecture from './components/ServingArchitecture';
import SceneBackground3D from './components/SceneBackground3D';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : 'https://inpersonin-resonix.hf.space');

/* ── Ripple helper ──────────────────────────────────────────── */
function spawnRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const r = document.createElement('span');
  r.classList.add('ripple');
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

/* ── Scroll reveal hook ─────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-scale');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

/* ── Nav sections ───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'discover', label: 'Discover', target: 'discover-section' },
  { id: 'library', label: 'Library', target: 'library-section' },
  { id: 'studios', label: 'Studios', target: 'studios-section' },
  { id: 'trends', label: 'Trends', target: 'trends-section' },
];

/* ============================================================
   MAIN APP
   ============================================================ */

export default function App() {
  /* ── State ── */
  const [mode, setMode] = useState('single');
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [batchText, setBatchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [matchedInput, setMatchedInput] = useState('');
  const [error, setError] = useState('');
  const [activeNav, setActiveNav] = useState('discover');
  const [typingActive, setTypingActive] = useState(false);
  const [activeChip, setActiveChip] = useState(null);
  const typingTimer = useRef(null);
  const recCardsRef = useRef([]);

  useReveal();

  /* ── Nav scroll-spy ─────────────────────────────────────── */
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY + 100;
      for (const item of [...NAV_ITEMS].reverse()) {
        const el = document.getElementById(item.target);
        if (el && el.offsetTop <= y) {
          setActiveNav(item.id);
          return;
        }
      }
      setActiveNav('discover');
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── Typing animation ───────────────────────────────────── */
  const pingTyping = useCallback(() => {
    setTypingActive(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingActive(false), 900);
  }, []);

  /* ── Core recommendation function ──────────────────────── */
  const runRecommendation = useCallback(async (songVal, artistVal) => {
    if (!songVal?.trim()) return;
    setLoading(true);
    setError('');
    setRecs([]);
    setMatchedInput(`${songVal} (${artistVal || 'any artist'})`);

    // Animate results section into view
    setTimeout(() => {
      document.getElementById('discover-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    try {
      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song: songVal.trim(), artist: artistVal?.trim() || '' }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setRecs(data.recommendations || []);

      // Staggered card entrance
      setTimeout(() => {
        recCardsRef.current.forEach((el, i) => {
          if (!el) return;
          setTimeout(() => el.classList.add('entered'), i * 60);
        });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
      setActiveChip(null);
    }
  }, []);

  /* ── Form submit ────────────────────────────────────────── */
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (mode === 'single') {
        runRecommendation(song, artist);
      } else {
        const lines = batchText.split('\n').filter(Boolean);
        if (lines.length > 0) {
          const [s, a] = lines[0].split(',').map((v) => v.trim());
          runRecommendation(s, a);
        }
      }
    },
    [mode, song, artist, batchText, runRecommendation]
  );

  /* ── Example chips ──────────────────────────────────────── */
  const EXAMPLES = [
    { song: 'Sad Guy', artist: 'Billie Eilish', label: 'Sad Guy — Billie Eilish' },
    { song: 'Love In The Dark', artist: 'Adele', label: 'Love In The Dark — Adele' },
    { song: 'Something Just Like This', artist: 'The Chainsmokers', label: 'Something Just Like This — The Chainsmokers' },
    { song: 'Smack That', artist: 'Akon', label: 'Smack That — Akon' },
    { song: 'Born To Be Yours', artist: 'Kygo', label: 'Born To Be Yours — Kygo' },
  ];

  const handleChip = useCallback(
    (e, ex) => {
      spawnRipple(e);
      if (loading) return;
      setActiveChip(ex.song);
      setSong(ex.song);
      setArtist(ex.artist);
      setMode('single');
      runRecommendation(ex.song, ex.artist);
    },
    [loading, runRecommendation]
  );

  /* ── Engine cards data ──────────────────────────────────── */
  const ENGINES = [
    {
      icon: '⊕',
      label: 'Collaborative Filtering',
      desc: 'Matrix factorization (SVD) baseline, refined by a Neural Collaborative Filtering model with negative sampling.',
      stats: [{ label: 'Embedding Dim', value: '256' }, { label: 'SVD', value: '✓' }],
      active: false,
    },
    {
      icon: '◈',
      label: 'Content-Based Audio',
      desc: 'Cosine similarity over 50 scaled tabular audio features: listenability, energy, valence, tempo, and mood per track — pure feature-space search.',
      stats: [{ label: 'Features', value: '50' }],
      active: false,
    },
    {
      icon: '⊛',
      label: 'Hybrid Combiner',
      desc: 'Merges top candidates from both engines, deduplicates, and benefits from whichever engine has spare candidates so every query returns a full 10-track list.',
      stats: [{ label: 'Split', value: '5 CB + 5 CF' }],
      active: true,
    },
    {
      icon: '↗',
      label: 'Cold-Start Fallback',
      desc: "Songs absent from playlist training data borrow the CF embedding of their closest audio-feature neighbor, so every track can still get a collaborative recommendation.",
      stats: [{ label: 'CF Coverage', value: '34.6%' }],
      active: false,
    },
  ];

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* 3D background */}
      <SceneBackground3D />

      <CustomCursor />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-logo">
          Res<span>o</span>nix
        </div>

        <ul className="nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-link${activeNav === item.id ? ' active' : ''}`}
                onClick={(e) => { spawnRipple(e); scrollTo(item.target); }}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button className="nav-icon-btn" title="Search">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>search</span>
          </button>
          <button className="nav-icon-btn" title="Account">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        id="discover-section"
        className="hero-section"
        style={{ position: 'relative', zIndex: 1, scrollMarginTop: '60px' }}
      >
        <div className="hero-badge reveal">
          <span className="hero-badge-dot" />
          Resonix Engine v2.1
        </div>

        <h1 className="hero-title reveal reveal-delay-1">
          Music Recommendations,<br />
          <span className="accent">Reimagined by AI</span>
        </h1>

        <p className="hero-subtitle reveal reveal-delay-2">
          Harness neural networks to discover soundscapes tailored to your exact sonic profile.
        </p>

        {/* Input card */}
        <div className={`input-card reveal reveal-delay-3${typingActive ? ' focused' : ''}`}>
          {/* Mode tabs */}
          <div className="mode-tabs">
            {['single', 'batch'].map((m) => (
              <button
                key={m}
                className={`mode-tab${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {m === 'single' ? 'Single Track' : 'Batch Import'}
              </button>
            ))}
          </div>

          {mode === 'single' ? (
            <>
              <div className="input-row">
                <div className="input-icon-wrap">
                  <span className="icon material-symbols-outlined">music_note</span>
                  <input
                    placeholder="Song title…"
                    value={song}
                    onChange={(e) => { setSong(e.target.value); pingTyping(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>
                <div className="input-icon-wrap">
                  <span className="icon material-symbols-outlined">person</span>
                  <input
                    placeholder="Artist…"
                    value={artist}
                    onChange={(e) => { setArtist(e.target.value); pingTyping(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>
              </div>

              {/* Waveform */}
              <div className={`waveform-wrap${typingActive ? ' active' : ''}`}>
                <AudioWaveform active={typingActive} />
              </div>
            </>
          ) : (
            <textarea
              className="batch-textarea"
              placeholder={'Song,Artist\nBlinding Lights,The Weeknd\nSomething Just Like This,The Chainsmokers'}
              value={batchText}
              onChange={(e) => { setBatchText(e.target.value); pingTyping(); }}
              rows={4}
            />
          )}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{ position: 'relative', overflow: 'hidden' }}
            onMouseDown={spawnRipple}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="loading-pulse">◆</span> Analyzing…
              </span>
            ) : (
              <>Get Recommendations →</>
            )}
          </button>
        </div>
      </section>

      {/* ── RESULTS ────────────────────────────────────────── */}
      {(recs.length > 0 || loading) && (
        <section className="results-section" style={{ position: 'relative', zIndex: 1 }}>
          <div className="results-header">
            <div>
              <div className="section-header">
                <span className="section-icon">◆</span>
                <h2 className="section-title">Recommendations</h2>
              </div>
              {recs.length > 0 && (
                <p className="section-desc">
                  {recs.length} matches generated by hybrid engine
                </p>
              )}
            </div>
            {matchedInput && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'Space Mono', maxWidth: 260, textAlign: 'right' }}>
                Matched: {matchedInput}
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '0.82rem', padding: '0.75rem 1rem', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '10px', background: 'rgba(255,50,50,0.05)' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="results-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rec-card" style={{ opacity: 1, transform: 'none' }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="results-grid">
              {recs.map((rec, i) => (
                <div
                  key={`${rec.song_name}-${i}`}
                  className="rec-card tilt-card"
                  ref={(el) => (recCardsRef.current[i] = el)}
                  style={{ transitionDelay: `${i * 40}ms` }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    e.currentTarget.style.transform = `perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-2px)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div className="rec-card-thumb">
                    {rec.album_art ? (
                      <img src={rec.album_art} alt={rec.song_name} onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span style={{ fontSize: '1.1rem' }}>♪</span>
                    )}
                  </div>
                  <div className="rec-card-info">
                    <div className="rec-card-title">{rec.song_name}</div>
                    <div className="rec-card-artist">{rec.artists}</div>
                    <div className="rec-badges">
                      {rec.source?.includes('CB') && <span className="rec-badge cb">CB</span>}
                      {rec.source?.includes('NCF') || rec.source?.includes('CF') ? <span className="rec-badge ncf">NCF</span> : null}
                      {!rec.source && <span className="rec-badge cb">hybrid</span>}
                    </div>
                  </div>
                  {rec.spotify_url && (
                    <a
                      href={rec.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spotify-link"
                      onClick={(e) => e.stopPropagation()}
                      title="Open in Spotify"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>open_in_new</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── LIBRARY: TRY A REAL EXAMPLE ────────────────────── */}
      <section
        id="library-section"
        className="examples-section reveal"
        style={{ position: 'relative', zIndex: 1, scrollMarginTop: '80px' }}
      >
        <div className="section-header">
          <span className="section-icon">◈</span>
          <h2 className="section-title">Try a Real Example</h2>
        </div>
        <p className="section-desc" style={{ marginBottom: '1rem' }}>
          These tracks are confirmed to exist in the 85,343-track catalogue. Tap one to run it through the live hybrid engine.
        </p>

        <div className="chips-wrap">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.song}
              className={`chip${activeChip === ex.song ? ' running' : ''}`}
              disabled={loading}
              onClick={(e) => handleChip(e, ex)}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <span className="chip-dot" />
              {ex.label}
              <span className="chip-arrow">
                {activeChip === ex.song ? '⟳' : '→'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── STUDIOS: ENGINEERED FOR SOUND ──────────────────── */}
      <section
        id="studios-section"
        className="engineered-section"
        style={{ position: 'relative', zIndex: 1, scrollMarginTop: '80px' }}
      >
        <div className="engineered-grid">
          <div className="reveal">
            <p className="eyebrow" style={{ marginBottom: '1rem' }}>Technical Foundation</p>
            <h2 className="display-lg" style={{ marginBottom: '1.25rem' }}>
              Engineered<br />for Sound.
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 420 }}>
              A hybrid recommender combining tabular audio-feature similarity with neural collaborative filtering, trained on real playlist co-occurrence data. Explore the technical foundation powering Resonix.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="ghost-btn"
                style={{ position: 'relative', overflow: 'hidden' }}
                onMouseDown={spawnRipple}
                onClick={() => window.open('#', '_blank')}
              >
                Explore Docs
              </button>
              <button
                className="ghost-btn"
                style={{ position: 'relative', overflow: 'hidden' }}
                onMouseDown={spawnRipple}
                onClick={() => window.open('#', '_blank')}
              >
                View API
              </button>
            </div>
          </div>

          {/* Animated SVG visual — signal merge diagram */}
          <div className="engineered-visual reveal reveal-delay-2">
            <EngineeredVisual />
          </div>
        </div>
      </section>

      {/* ── TRENDS: RECOMMENDATION ENGINES ─────────────────── */}
      <section
        id="trends-section"
        className="engines-section"
        style={{ position: 'relative', zIndex: 1, scrollMarginTop: '80px' }}
      >
        <div className="section-header reveal">
          <span className="section-icon">↗</span>
          <h2 className="section-title">Recommendation Engines</h2>
        </div>
        <p className="section-desc reveal" style={{ marginBottom: 0 }}>
          Four complementary strategies working in concert.
        </p>

        <div className="engine-cards-grid">
          {ENGINES.map((eng, i) => (
            <div
              key={eng.label}
              className={`engine-card reveal reveal-delay-${i + 1}`}
              style={{ scrollMarginTop: '80px' }}
            >
              {eng.active && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', fontFamily: 'Space Mono', color: 'var(--green-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-accent)', animation: 'liveDot 2s ease-in-out infinite', display: 'inline-block' }} />
                  Active
                </div>
              )}
              <div className="engine-card-icon">{eng.icon}</div>
              <h3>{eng.label}</h3>
              <p>{eng.desc}</p>
              <div className="engine-card-stats">
                {eng.stats.map((s) => (
                  <div key={s.label}>
                    <div className="engine-stat-label">{s.label}</div>
                    <div className="engine-stat-value">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DATASET PIPELINE ───────────────────────────────── */}
      <section
        className="pipeline-section"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="section-header reveal">
          <span className="section-icon">⟳</span>
          <h2 className="section-title">Dataset Pipeline</h2>
        </div>

        <div className="pipeline-container reveal">
          <div className="pipeline-nodes">
            <PipelineNode
              icon="⊗"
              title="Data Matching"
              desc="85,343 audio-feature tracks indexed and matched against 2.1M playlist interactions."
            />
            <div className="pipeline-connector" />
            <PipelineNode
              icon="⊕"
              title="Feature Scaling"
              desc="50 audio features standardized per track for content-based cosine similarity."
            />
            <div className="pipeline-connector" />
            <PipelineNode
              icon="⊛"
              title="NCF Training"
              desc="320 embeddings standardized over 20,255 songs via negative-sampled implicit feedback."
            />
          </div>
        </div>
      </section>

      {/* ── SERVING ARCHITECTURE ───────────────────────────── */}
      <section
        style={{ padding: '0 2rem 5rem', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}
      >
        <div className="reveal">
          <ServingArchitecture />
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="footer" style={{ position: 'relative', zIndex: 1 }}>
        <div className="navbar-logo">
          Res<span className="text-accent">o</span>nix
        </div>
        <div className="footer-copy">© 2024 Resonix AI · Engineered for Sound.</div>
        <nav className="footer-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#" className="accent-link">API</a>
          <a href="#">Support</a>
        </nav>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function PipelineNode({ icon, title, desc }) {
  return (
    <div className="pipeline-node">
      <div className="pipeline-node-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

function EngineeredVisual() {
  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3dba60" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3dba60" stopOpacity="0" />
        </radialGradient>
        <filter id="blur4">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3dba60" stopOpacity="0" />
          <stop offset="50%" stopColor="#4ccc72" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3dba60" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3dba60" stopOpacity="0" />
          <stop offset="50%" stopColor="#4ccc72" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3dba60" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background grid dots */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={col * 44 + 22}
            cy={row * 38 + 19}
            r="1"
            fill="rgba(61,186,96,0.15)"
          />
        ))
      )}

      {/* CB node */}
      <circle cx="90" cy="100" r="36" fill="url(#nodeGlow)" />
      <circle cx="90" cy="100" r="28" fill="rgba(6,6,6,0.9)" stroke="rgba(61,186,96,0.35)" strokeWidth="1" />
      <text x="90" y="95" textAnchor="middle" fill="#4ccc72" fontSize="9" fontFamily="Space Mono">CB</text>
      <text x="90" y="107" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Space Mono">AUDIO</text>

      {/* NCF node */}
      <circle cx="90" cy="200" r="36" fill="url(#nodeGlow)" />
      <circle cx="90" cy="200" r="28" fill="rgba(6,6,6,0.9)" stroke="rgba(100,180,255,0.3)" strokeWidth="1" />
      <text x="90" y="195" textAnchor="middle" fill="#78b9ff" fontSize="9" fontFamily="Space Mono">NCF</text>
      <text x="90" y="207" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Space Mono">COLLAB</text>

      {/* Merge node */}
      <circle cx="250" cy="150" r="44" fill="url(#nodeGlow)" />
      <circle cx="250" cy="150" r="36" fill="rgba(6,6,6,0.95)" stroke="rgba(61,186,96,0.5)" strokeWidth="1.5" />
      <text x="250" y="145" textAnchor="middle" fill="#4ccc72" fontSize="9" fontFamily="Space Mono">HYBRID</text>
      <text x="250" y="158" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Space Mono">COMBINER</text>

      {/* Output node */}
      <rect x="318" y="128" width="60" height="44" rx="10" fill="rgba(6,6,6,0.9)" stroke="rgba(61,186,96,0.3)" strokeWidth="1" />
      <text x="348" y="147" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8" fontFamily="Space Mono">TOP 10</text>
      <text x="348" y="159" textAnchor="middle" fill="var(--green-accent)" fontSize="7" fontFamily="Space Mono">TRACKS</text>

      {/* Lines from CB/NCF to Hybrid */}
      <line x1="118" y1="100" x2="214" y2="140" stroke="rgba(61,186,96,0.25)" strokeWidth="1" />
      <line x1="118" y1="200" x2="214" y2="162" stroke="rgba(100,180,255,0.2)" strokeWidth="1" />

      {/* Animated signal on CB→Hybrid */}
      <circle r="3" fill="#4ccc72" opacity="0.9">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 118 100 L 214 140" />
        <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* Animated signal on NCF→Hybrid */}
      <circle r="3" fill="#78b9ff" opacity="0.9">
        <animateMotion dur="2.5s" begin="1.25s" repeatCount="indefinite" path="M 118 200 L 214 162" />
        <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
      </circle>

      {/* Line from Hybrid to Output */}
      <line x1="286" y1="150" x2="318" y2="150" stroke="rgba(61,186,96,0.3)" strokeWidth="1" />
      <circle r="2.5" fill="#4ccc72" opacity="0.9">
        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 286 150 L 318 150" />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* Feature labels */}
      <text x="90" y="144" textAnchor="middle" fill="rgba(61,186,96,0.4)" fontSize="6.5" fontFamily="Space Mono">energy · tempo · mood</text>
      <text x="90" y="244" textAnchor="middle" fill="rgba(100,180,255,0.4)" fontSize="6.5" fontFamily="Space Mono">playlist co-occurrence</text>
    </svg>
  );
}
