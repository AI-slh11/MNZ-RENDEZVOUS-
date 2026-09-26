const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple code+password login. Returns the user record (no name shown to other roles).
// Note: this is intentionally minimal (no JWT/hashing) to keep the MVP easy to run;
// swap in bcrypt + JWT before any real deployment.
router.post('/login', (req, res) => {
  const { code, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE code = ? AND password = ?').get(code, password);
  if (!user) return res.status(401).json({ error: 'Invalid code or password' });
  delete user.password;
  res.json({ user });
});

// Organizer-only: create a new judge login
router.post('/judges', (req, res) => {
  const { code, password, name } = req.body;
  if (!code || !password || !name) return res.status(400).json({ error: 'code, password, name required' });
  try {
    db.prepare('INSERT INTO users (code, password, name, role) VALUES (?,?,?,\'judge\')').run(code, password, name);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Judge code already exists' });
  }
});

router.get('/judges', (req, res) => {
  const judges = db.prepare("SELECT id, code, name FROM users WHERE role = 'judge'").all();
  res.json(judges);
});

module.exports = router;
