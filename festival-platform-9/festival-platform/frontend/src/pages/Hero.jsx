import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GhostFibers from '../GhostFibers.jsx';
import ExpandableProfileCard from '../ExpandableProfileCard.jsx';
import ScrollTextLine from '../ScrollTextLine.jsx';

const WORD = 'RENDEZVOUS';
const POP_COLORS = ['#017d8b', '#19bb47', '#e2fa04'];

export default function Hero() {
  // Tracks which letters are mid-animation and what color they popped to,
  // so each letter reacts to its own click independently.
  const [popped, setPopped] = useState({});
  const heroRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); // normalized -1..1, drives parallax depth

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const el = heroRef.current;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setTilt({ x, y });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const hitLetter = (i) => {
    const color = POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)];
    setPopped(prev => ({ ...prev, [i]: color }));
    setTimeout(() => {
      setPopped(prev => {
        const next = { ...prev };
        delete next[i];
        return next;
      });
    }, 500);
  };

  // Each layer moves at a different depth: blobs drift furthest (background),
  // the wordmark shifts subtly (mid-ground), giving a sense of depth on mouse move.
  const layerStyle = (depth) => ({
    transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`
  });

  return (
    <>
    <section className="hero" ref={heroRef}>
      <GhostFibers lineColor="#19bb47" glowColor="#017d8b" layers={5} speed={0.3} waveAmplitude={38} frequency={1.4} />
      <div className="blob-parallax" style={layerStyle(22)}><div className="hero-blob blob-a" /></div>
      <div className="blob-parallax" style={layerStyle(-18)}><div className="hero-blob blob-b" /></div>
      <div className="blob-parallax" style={layerStyle(14)}><div className="hero-blob blob-c" /></div>

      <img src="/brand/logo-mark.png" alt="" className="hero-logomark" style={layerStyle(6)} />

      <p className="hero-eyebrow" style={layerStyle(4)}>Phytolore Presents</p>

      <div className="hero-word-row" style={layerStyle(8)}>
        <h1 className="hero-word" aria-label="Rendezvous">
          {WORD.split('').map((letter, i) => (
            <span
              key={i}
              className="hero-letter"
              style={popped[i] ? { color: popped[i], transform: 'translateY(-14px) scale(1.15)' } : undefined}
              onClick={() => hitLetter(i)}
            >
              {letter}
            </span>
          ))}
        </h1>
        <span className="hero-companion">26</span>
      </div>

      <p className="hero-sub">
        One stage, one page. Register for a competition, watch the judging happen
        live, and see rankings update the moment a score lands.
      </p>

      <div className="hero-glass">
        <div className="hero-actions">
          <Link to="/register" className="hero-btn primary">Register for a program</Link>
          <Link to="/leaderboard" className="hero-btn ghost">Watch the leaderboard</Link>
        </div>
      </div>
    </section>

    <ScrollTextLine />

    <section className="team-section">
      <h2>Who's running the show</h2>
      <p className="team-sub">Tap a card for the full picture.</p>
      <div className="profile-grid">
        <ExpandableProfileCard
          name="Aisha Rahman"
          role="Festival Organizer"
          initials="AR"
          accent="#017d8b"
          bio="Runs the Green Room end to end — program scheduling, on-site registration, and judge assignment. First point of contact for anything logistics."
          tags={['Scheduling', 'Green Room', 'Judge Assignment']}
        />
        <ExpandableProfileCard
          name="Marcus Devan"
          role="Head Judge — Stage Events"
          initials="MD"
          accent="#19bb47"
          bio="Ten years judging collegiate performance competitions. Scores stage programs on presence, technique, and audience connection."
          tags={['Music', 'Spoken Word', 'Drama']}
        />
        <ExpandableProfileCard
          name="Priya Nair"
          role="Head Judge — Writing"
          initials="PN"
          accent="#aee515"
          bio="Reviews every written submission blind — code letter only, never a name. Focuses on structure, voice, and command of language."
          tags={['Essays', 'Poetry', 'Short Fiction']}
        />
      </div>
    </section>
    </>
  );
}
