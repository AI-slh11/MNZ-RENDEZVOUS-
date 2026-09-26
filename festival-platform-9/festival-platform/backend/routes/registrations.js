const express = require('express');
const router = express.Router();
const db = require('../db');

function letterForIndex(n) {
  // 0 -> A, 1 -> B ... 25 -> Z, 26 -> AA, 27 -> AB ...
  let s = '';
  n = n + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Register a student for a program. Works identically for organizer on-site (Green Room)
// registration and public online self-registration; `source` distinguishes them.
router.post('/', (req, res) => {
  const { program_id, student_name, student_id, is_team, team_members, language, source } = req.body;
  if (!program_id || !student_name || !student_id) {
    return res.status(400).json({ error: 'program_id, student_name, student_id required' });
  }
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(program_id);
  if (!program) return res.status(404).json({ error: 'Program not found' });

  const existingCount = db.prepare('SELECT COUNT(*) c FROM registrations WHERE program_id = ?').get(program_id).c;
  const codeLetter = letterForIndex(existingCount);
  const regNumber = String(existingCount + 1).padStart(3, '0');
  const participantId = `FEST-${program.code}-${regNumber}-${codeLetter}`;

  const info = db.prepare(`
    INSERT INTO registrations (program_id, student_name, student_id, is_team, team_members, language, code_letter, participant_id, source)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    program_id, student_name, student_id, is_team ? 1 : 0, team_members || null,
    language || null, codeLetter, participantId, source === 'onsite' ? 'onsite' : 'online'
  );

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(info.lastInsertRowid);

  // Real-time push to any judge portal open on this program (Green Room -> Judge Portal sync)
  const io = req.app.get('io');
  io.to(`program:${program_id}`).emit('registration:new', {
    id: registration.id,
    program_id,
    code_letter: registration.code_letter,
    participant_id: registration.participant_id,
    status: registration.status,
    is_team: !!registration.is_team
  });

  res.status(201).json({ registration });
});

// Organizer / full view: includes student name & ID
router.get('/', (req, res) => {
  const { program_id } = req.query;
  const rows = program_id
    ? db.prepare('SELECT * FROM registrations WHERE program_id = ? ORDER BY created_at ASC').all(program_id)
    : db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
  res.json(rows);
});

// Judge view: anonymized - code letter + status only, no student name/ID
router.get('/judge-view', (req, res) => {
  const { program_id } = req.query;
  if (!program_id) return res.status(400).json({ error: 'program_id required' });
  const rows = db.prepare(`
    SELECT id, program_id, code_letter, participant_id, is_team, status, created_at
    FROM registrations WHERE program_id = ? ORDER BY created_at ASC
  `).all(program_id);
  res.json(rows);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['registered', 'submission_received', 'slot_assigned', 'judged', 'results_announced'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' });
  db.prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
