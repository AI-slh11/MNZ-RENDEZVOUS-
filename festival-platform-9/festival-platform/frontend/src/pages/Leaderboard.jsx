import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { socket } from '../socket.js';

export default function Leaderboard() {
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => { api.listPrograms().then(setPrograms).catch(() => {}); }, []);

  const load = (programId) => {
    if (!programId) return;
    api.results(programId).then(setResults).catch(() => {});
  };

  useEffect(() => {
    load(activeProgram);
    if (!activeProgram) return;
    socket.emit('join_program', activeProgram);
    const onScore = () => load(activeProgram);
    socket.on('score:submitted', onScore);
    return () => {
      socket.emit('leave_program', activeProgram);
      socket.off('score:submitted', onScore);
    };
  }, [activeProgram]);

  return (
    <div>
      <h2>🏆 Live Leaderboard</h2>
      <div className="card">
        <label>Program</label>
        <select value={activeProgram} onChange={e => setActiveProgram(e.target.value)}>
          <option value="">Select a program...</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {results && (
        <div className="card">
          {results.ranked.length === 0 ? (
            <p className="muted">Results will appear here as soon as scores are submitted.</p>
          ) : (
            <table className="big">
              <thead><tr><th>Rank</th><th>Participant Code</th><th>Score</th></tr></thead>
              <tbody>
                {results.ranked.map(r => (
                  <tr key={r.registration_id} className={r.rank <= 3 ? `place-${r.rank}` : ''}>
                    <td>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                    <td>{r.code_letter}</td>
                    <td>{r.average_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
