const express = require('express');
const router = express.Router();
const db = require('../db');

// List all programs (with assigned judges + registration counts)
router.get('/', (req, res) => {
  const programs = db.prepare('SELECT * FROM programs ORDER BY created_at DESC').all();
  const judgesStmt = db.prepare(`
    SELECT u.id, u.code, u.name FROM program_judges pj
    JOIN users u ON u.id = pj.judge_id WHERE pj.program_id = ?
  `);
  const countStmt = db.prepare('SELECT COUNT(*) c FROM registrations WHERE program_id = ?');
  const result = programs.map(p => ({
    ...p,
    judges: judgesStmt.all(p.id),
    registration_count: countStmt.get(p.id).c
  }));
  res.json(result);
});

// Programs assigned to a specific judge
router.get('/for-judge/:judgeId', (req, res) => {
  const programs = db.prepare(`
    SELECT p.* FROM programs p
    JOIN program_judges pj ON pj.program_id = p.id
    WHERE pj.judge_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.judgeId);
  res.json(programs);
});

// Create a program (organizer)
router.post('/', (req, res) => {
  const { name, code, type, language, time_slot } = req.body;
  if (!name || !code || !type) return res.status(400).json({ error: 'name, code, type required' });
  if (!['writing', 'stage'].includes(type)) return res.status(400).json({ error: 'type must be writing or stage' });
  const info = db.prepare(
    'INSERT INTO programs (name, code, type, language, time_slot) VALUES (?,?,?,?,?)'
  ).run(name, code.toUpperCase(), type, language || null, time_slot || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Assign a judge to a program (manual assignment by organizer)
router.post('/:id/judges', (req, res) => {
  const { judge_id } = req.body;
  try {
    db.prepare('INSERT INTO program_judges (program_id, judge_id) VALUES (?,?)').run(req.params.id, judge_id);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Judge already assigned to this program' });
  }
});

router.delete('/:id/judges/:judgeId', (req, res) => {
  db.prepare('DELETE FROM program_judges WHERE program_id = ? AND judge_id = ?').run(req.params.id, req.params.judgeId);
  res.json({ ok: true });
});

module.exports = router;
