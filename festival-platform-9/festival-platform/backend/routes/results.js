const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');

// Ranked results for one program. Only the final AVERAGED score is exposed here -
// individual judge scores stay internal to the scores table (confidential from organizers).
function computeRankings(programId) {
  const registrations = db.prepare('SELECT * FROM registrations WHERE program_id = ?').all(programId);
  const rows = registrations.map(r => {
    const agg = db.prepare('SELECT AVG(score) avg_score, COUNT(*) n FROM scores WHERE registration_id = ?').get(r.id);
    return {
      registration_id: r.id,
      participant_id: r.participant_id,
      code_letter: r.code_letter,
      is_team: !!r.is_team,
      status: r.status,
      judges_submitted: agg.n,
      average_score: agg.n > 0 ? Math.round(agg.avg_score * 100) / 100 : null
    };
  });
  const judged = rows.filter(r => r.average_score !== null).sort((a, b) => b.average_score - a.average_score);
  const unjudged = rows.filter(r => r.average_score === null);
  judged.forEach((r, i) => { r.rank = i + 1; });
  return { ranked: judged, pending: unjudged };
}

router.get('/:programId', (req, res) => {
  res.json(computeRankings(req.params.programId));
});

// Certificate PDF for a placed participant (1st/2nd/3rd). Streams a simple generated PDF.
router.get('/:programId/certificate/:registrationId', (req, res) => {
  const { programId, registrationId } = req.params;
  const { ranked } = computeRankings(programId);
  const entry = ranked.find(r => String(r.registration_id) === String(registrationId));
  if (!entry || entry.rank > 3) return res.status(404).json({ error: 'No certificate available (not placed 1st-3rd)' });

  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(programId);
  const placeLabel = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' }[entry.rank];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${entry.participant_id}.pdf"`);

  const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
  doc.pipe(res);
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
  doc.fontSize(28).text('Certificate of Achievement', 0, 100, { align: 'center' });
  doc.fontSize(16).text('Campus Festival', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(20).text(placeLabel, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Program: ${program.name}`, { align: 'center' });
  doc.text(`Participant Code: ${entry.code_letter}`, { align: 'center' });
  doc.text(`Participant ID: ${entry.participant_id}`, { align: 'center' });
  doc.end();
});

module.exports = router;
