import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ProgramsAdmin() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', type: 'stage', language: '', time_slot: '' });
  const [error, setError] = useState('');

  const load = () => api.listPrograms().then(setPrograms).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProgram(form);
      setForm({ name: '', code: '', type: 'stage', language: '', time_slot: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Programs / Competitions</h2>
      <div className="card narrow">
        <h3>Create Program</h3>
        <form onSubmit={submit}>
          <label>Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Essay Writing (English)" required />
          <label>Short Code (used in Participant IDs)</label>
          <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. ESH" required />
          <label>Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="stage">Stage (live performance — songs, speeches, qawwali, nasheeda...)</option>
            <option value="writing">Writing (pre-submitted essay/story)</option>
          </select>
          <label>Time Slot</label>
          <input value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })} placeholder="e.g. Day 1, 10:00-11:00" />
          {error && <p className="error">{error}</p>}
          <button type="submit">Create Program</button>
        </form>
      </div>

      <div className="card">
        <h3>All Programs</h3>
        <table>
          <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Time Slot</th><th>Registered</th><th>Judges</th></tr></thead>
          <tbody>
            {programs.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td><td>{p.code}</td><td>{p.type}</td><td>{p.time_slot || '—'}</td>
                <td>{p.registration_count}</td>
                <td>{p.judges.map(j => j.name).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
