const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'festival.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,       -- login code, e.g. ORG-001 / JUDGE-2024-001
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('organizer','judge')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,              -- short code used in participant IDs, e.g. ESH, SNG
  type TEXT NOT NULL CHECK(type IN ('writing','stage')),
  language TEXT,                   -- only relevant for writing programs
  time_slot TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS program_judges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  judge_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(program_id, judge_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  is_team INTEGER NOT NULL DEFAULT 0,
  team_members TEXT,               -- comma separated, only if is_team
  language TEXT,                   -- chosen language for writing programs
  code_letter TEXT NOT NULL,       -- A, B, C ... per program, in registration order
  participant_id TEXT UNIQUE NOT NULL, -- FEST-[ProgramCode]-[RegNumber]-[CodeLetter]
  source TEXT NOT NULL CHECK(source IN ('online','onsite')) DEFAULT 'online',
  submission_file TEXT,            -- filename for writing submissions
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK(status IN ('registered','submission_received','slot_assigned','judged','results_announced')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  judge_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score REAL NOT NULL CHECK(score >= 0 AND score <= 100),
  grade TEXT NOT NULL,             -- A / B / C / D / F
  remarks TEXT,                    -- max 500 chars, enforced in route
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(registration_id, judge_id) -- one score per judge per participant, final once submitted
);

CREATE INDEX IF NOT EXISTS idx_reg_program ON registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_scores_reg ON scores(registration_id);
`);

// Seed a default organizer + a couple of judges on first run so the app is usable immediately.
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const insert = db.prepare('INSERT INTO users (code, password, name, role) VALUES (?,?,?,?)');
  insert.run('ORG-001', 'organizer123', 'Festival Organizer', 'organizer');
  insert.run('JUDGE-2024-001', 'judge123', 'Judge One', 'judge');
  insert.run('JUDGE-2024-002', 'judge123', 'Judge Two', 'judge');
}

module.exports = db;
