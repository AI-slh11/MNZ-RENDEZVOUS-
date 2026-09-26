import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Register() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({
    program_id: '', student_name: '', student_id: '', is_team: false, team_members: '', language: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.listPrograms().then(setPrograms).catch(() => {}); }, []);

  const selectedProgram = programs.find(p => String(p.id) === String(form.program_id));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    try {
      const { registration } = await api.register({ ...form, source: 'online' });
      setResult(registration);
      setForm({ program_id: '', student_name: '', student_id: '', is_team: false, team_members: '', language: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card narrow">
      <h2>Student Registration</h2>
      <p className="muted">Same form for stage & writing programs. Open to all campus members.</p>
      <form onSubmit={submit}>
        <label>Program</label>
        <select value={form.program_id} onChange={e => setForm({ ...form, program_id: e.target.value })} required>
          <option value="">Select a program...</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.type}{p.time_slot ? ` — ${p.time_slot}` : ''})</option>
          ))}
        </select>

        <label>Full Name</label>
        <input value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} required />

        <label>Student ID</label>
        <input value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required />

        <label className="checkbox">
          <input type="checkbox" checked={form.is_team} onChange={e => setForm({ ...form, is_team: e.target.checked })} />
          Registering as a team
        </label>
        {form.is_team && (
          <>
            <label>Team Members (comma separated)</label>
            <input value={form.team_members} onChange={e => setForm({ ...form, team_members: e.target.value })} />
          </>
        )}

        {selectedProgram?.type === 'writing' && (
          <>
            <label>Language</label>
            <input value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
              placeholder="e.g. English, Hindi, Malayalam" required />
            <p className="muted small">Writing submissions (essay/story files) are uploaded on-site or emailed to organizers ahead of the festival in this MVP.</p>
          </>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>

      {result && (
        <div className="success-box">
          <strong>Registered!</strong>
          <p>Your Code Letter: <strong>{result.code_letter}</strong></p>
          <p>Your Participant ID: <strong>{result.participant_id}</strong></p>
          <p className="muted small">Keep this ID — it's used to look up your results.</p>
        </div>
      )}
    </div>
  );
}
