const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'notarium-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Serve uploads + static files (always re-validate so code changes show up after a plain refresh)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { setHeaders: res => res.setHeader('Cache-Control', 'no-cache') }));
app.use(express.static(path.join(__dirname, 'public'), { setHeaders: res => res.setHeader('Cache-Control', 'no-cache') }));

/* The office workflow has exactly two statuses; each one implies a location */
const ALLOWED_STATUSES = ['For Submission', 'Submitted'];
const STATUS_LOCATION = { 'For Submission': 'Law Office', 'Submitted': 'Main Office' };
/* Tolerate stale pages / old labels: map them to the canonical two */
const STATUS_ALIASES = {
  'FOR SUBMISSION': 'For Submission',
  'IN OFFICE': 'For Submission',
  'MAIN OFFICE': 'Submitted',
  'OTHERS': 'For Submission',
  'SUBMITTED': 'Submitted'
};
function canonicalStatus(value) {
  const raw = String(value || '').trim();
  if (ALLOWED_STATUSES.includes(raw)) return raw;
  return STATUS_ALIASES[raw.toUpperCase()] || null;
}

/* ---------------- Auth ---------------- */
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const ident = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(name) = ?').get(ident, ident);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json(user);
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

/* Role-based access: account, type registry, and system settings are admin duties */
function requireAdmin(req, res, next) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'Admin') {
    return res.status(403).json({ error: 'This action is restricted to the office administrator' });
  }
  next();
}

/* ---------------- Records ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|jpe?g|png|docx?|xlsx?)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only PDF, JPG, PNG, DOC, DOCX, XLS, XLSX files are allowed'), ok);
  }
});

function validateRecord(body, excludeId = 0) {
  const { doc_number, doc_type, client_name, date_notarized } = body;
  if (!doc_number || !String(doc_number).trim()) return 'Document Number is required';
  if (!doc_type) return 'Document Type is required';
  if (!client_name || !String(client_name).trim()) return 'Client Name is required';
  if (!date_notarized) return 'Date Notarized is required';
  if (!canonicalStatus(body.status)) return 'Invalid Status';
  const dup = db.prepare('SELECT id FROM records WHERE doc_number = ? AND id != ?')
    .get(String(doc_number).trim(), excludeId);
  if (dup) return 'This Document Number has already been recorded';
  return null;
}

app.get('/api/records', requireAuth, (req, res) => {
  const { search = '', type = '', status = '', from = '', to = '', page = 1, limit = 10 } = req.query;
  const where = []; const params = {};
  if (search) { where.push('(r.doc_number LIKE @search OR r.client_name LIKE @search OR r.doc_type LIKE @search)'); params.search = `%${search}%`; }
  if (type) { where.push('r.doc_type = @type'); params.type = type; }
  if (status) { where.push('r.status = @status'); params.status = status; }
  if (from) { where.push('r.date_notarized >= @from'); params.from = from; }
  if (to) { where.push('r.date_notarized <= @to'); params.to = to; }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM records r ${whereSql}`).get(params).c;
  const lim = Math.max(1, Math.min(100, +limit));
  const off = (Math.max(1, +page) - 1) * lim;
  const rows = db.prepare(`SELECT r.* FROM records r ${whereSql}
    ORDER BY r.date_notarized DESC, r.id DESC LIMIT ${lim} OFFSET ${off}`).all(params);
  res.json({ rows, total, page: Math.max(1, +page), pages: Math.max(1, Math.ceil(total / lim)) });
});

app.get('/api/records/check/:docno', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, doc_number, client_name, date_notarized FROM records WHERE doc_number = ?')
    .get(req.params.docno.trim());
  res.json({ exists: !!row, record: row || null });
});

app.get('/api/records/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Record not found' });
  res.json(row);
});

app.post('/api/records', requireAuth, upload.single('document'), (req, res) => {
  const err = validateRecord(req.body);
  if (err) return res.status(409).json({ error: err });
  const f = req.file;
  const status = canonicalStatus(req.body.status);
  const location = STATUS_LOCATION[status];
  const info = db.prepare(`INSERT INTO records
    (doc_number, doc_type, client_name, date_notarized, status, location, remarks, file_name, file_path, file_size)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(req.body.doc_number.trim(), req.body.doc_type, req.body.client_name.trim(),
      req.body.date_notarized, status, location, req.body.remarks || null,
      f ? f.originalname : null, f ? '/uploads/' + f.filename : null, f ? f.size : null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/records/:id', requireAuth, upload.single('document'), (req, res) => {
  const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  const err = validateRecord(req.body, existing.id);
  if (err) return res.status(409).json({ error: err });
  const f = req.file;
  const status = canonicalStatus(req.body.status);
  const location = STATUS_LOCATION[status];
  db.prepare(`UPDATE records SET doc_number=?, doc_type=?, client_name=?, date_notarized=?,
    status=?, location=?, remarks=?, file_name=?, file_path=?, file_size=?, updated_at=datetime('now')
    WHERE id=?`)
    .run(req.body.doc_number.trim(), req.body.doc_type, req.body.client_name.trim(),
      req.body.date_notarized, status, location, req.body.remarks || null,
      f ? f.originalname : existing.file_name,
      f ? '/uploads/' + f.filename : existing.file_path,
      f ? f.size : existing.file_size,
      existing.id);
  res.json({ ok: true });
});

/* Quick status / location tracking without resubmitting the whole record.
   The location always follows the status (For Submission = Law Office,
   Submitted = Main Office), so callers only send the status. */
app.patch('/api/records/:id/track', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  const status = canonicalStatus('status' in req.body ? req.body.status : existing.status);
  if (!status) return res.status(400).json({ error: 'Invalid Status' });
  const location = STATUS_LOCATION[status];
  db.prepare(`UPDATE records SET status = ?, location = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, location, existing.id);
  res.json({ ok: true, status, location });
});

/* Bulk update: set the same status (and its matching location) on many
   records at once — e.g. 20 documents sent to the Main Office.
   Runs inside a transaction: every selected record is updated together
   (all-or-nothing) and the location is always derived from the status
   on the server, never trusted from the client. */
app.post('/api/records/bulk-track', requireAuth, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(v => +v).filter(Number.isInteger) : [];
  if (!ids.length) return res.status(400).json({ error: 'Select at least one record to update' });
  if (ids.length > 500) return res.status(400).json({ error: 'Too many records selected — please update in smaller batches' });
  const status = canonicalStatus(req.body.status);
  if (!status) return res.status(400).json({ error: 'Invalid Status' });
  const location = STATUS_LOCATION[status];
  const placeholders = ids.map(() => '?').join(',');
  db.exec('BEGIN IMMEDIATE');
  try {
    const info = db.prepare(`UPDATE records SET status = ?, location = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})`).run(status, location, ...ids);
    db.exec('COMMIT');
    res.json({ ok: true, updated: info.changes, status, location });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Bulk update failed — nothing was changed' });
  }
});

app.delete('/api/records/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Dashboard stats ---------------- */
app.get('/api/stats', requireAuth, (req, res) => {
  const year = +req.query.year || new Date().getFullYear();
  const now = new Date();
  /* local calendar months (toISOString is UTC and shifts the boundary in UTC+ timezones) */
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const firstOfMonth = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  const firstOfNextMonth = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const firstOfPrevMonth = ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const total = db.prepare('SELECT COUNT(*) c FROM records').get().c;
  /* records dated inside the current calendar month vs the previous one */
  const thisMonth = db.prepare('SELECT COUNT(*) c FROM records WHERE date_notarized >= ? AND date_notarized < ?')
    .get(firstOfMonth, firstOfNextMonth).c;
  const lastMonth = db.prepare('SELECT COUNT(*) c FROM records WHERE date_notarized >= ? AND date_notarized < ?')
    .get(firstOfPrevMonth, firstOfMonth).c;
  const forSubmission = db.prepare("SELECT COUNT(*) c FROM records WHERE status = 'For Submission'").get().c;
  const submitted = db.prepare("SELECT COUNT(*) c FROM records WHERE status = 'Submitted'").get().c;
  // Where the submitted files are currently kept (top location)
  const topLoc = db.prepare(`SELECT location l, COUNT(*) c FROM records
    WHERE status = 'Submitted' AND location IS NOT NULL AND location != ''
    GROUP BY location ORDER BY c DESC LIMIT 1`).get();
  const monthly = db.prepare(`SELECT strftime('%m', date_notarized) m, COUNT(*) c
    FROM records WHERE strftime('%Y', date_notarized) = ? GROUP BY m`).all(String(year));
  const monthlyMap = {}; monthly.forEach(r => monthlyMap[r.m] = r.c);
  const months = Array.from({ length: 12 }, (_, i) =>
    monthlyMap[String(i + 1).padStart(2, '0')] || 0);
  const recent = db.prepare('SELECT id, doc_number, doc_type, client_name, date_notarized, status, location FROM records ORDER BY date_notarized DESC, id DESC LIMIT 5').all();
  const years = db.prepare("SELECT DISTINCT strftime('%Y', date_notarized) y FROM records ORDER BY y DESC").all().map(r => r.y);
  const typeRows = db.prepare(`SELECT doc_type name, COUNT(*) c FROM records
    WHERE substr(date_notarized, 1, 7) = ? GROUP BY doc_type ORDER BY c DESC`).all(firstOfMonth.slice(0, 7));
  res.json({
    total, thisMonth, lastMonth, forSubmission, submitted,
    submittedAt: topLoc ? topLoc.l : '',
    months, recent, years,
    typeSummary: typeRows
  });
});

/* ---------------- Reports ---------------- */
app.get('/api/report', requireAuth, (req, res) => {
  const month = +req.query.month || (new Date().getMonth() + 1);
  const year = +req.query.year || new Date().getFullYear();
  const mm = Math.min(12, Math.max(1, month));
  const rows = db.prepare(`SELECT * FROM records
    WHERE substr(date_notarized, 1, 7) = ? ORDER BY date_notarized ASC, id ASC`).all(`${year}-${String(mm).padStart(2, '0')}`);
  const totals = db.prepare(`SELECT COUNT(*) total,
    SUM(CASE WHEN status='For Submission' THEN 1 ELSE 0 END) forSubmission,
    SUM(CASE WHEN status='Submitted' THEN 1 ELSE 0 END) submitted
    FROM records WHERE substr(date_notarized, 1, 7) = ?`).get(`${year}-${String(mm).padStart(2, '0')}`);
  res.json({ rows, totals, month: mm, year });
});

/* ---------------- Document Types ---------------- */
app.get('/api/doc-types', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM records r WHERE r.doc_type = t.name) count
    FROM doc_types t ORDER BY name`).all();
  res.json(rows);
});
app.post('/api/doc-types', requireAdmin, (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const info = db.prepare('INSERT INTO doc_types (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'This document type already exists' });
  }
});
app.delete('/api/doc-types/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM doc_types WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Email verification codes ----------------
   When a new staff account email is entered, a 6-digit code is
   generated for it (valid 10 minutes) and delivered to that email.
   If outgoing SMTP has been configured in Office Settings
   (smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from) the code
   is emailed with nodemailer; without SMTP the system hands the
   code back to the screen so the flow still works offline. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MIN = 10;

function getSmtpSettings() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").all();
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return (s.smtp_host && s.smtp_user && s.smtp_pass) ? s : null;
}

async function sendVerificationEmail(email, code) {
  const smtp = getSmtpSettings();
  if (!smtp) return { delivered: false };
  try {
    const nodemailer = require('nodemailer');
    const port = Number(smtp.smtp_port) || 465;
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host, port, secure: port === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass }
    });
    const from = smtp.smtp_from || smtp.smtp_user;
    await transport.sendMail({
      from: `NOTARIX <${from}>`, to: email,
      subject: 'NOTARIX — Verification Code',
      text: `Your NOTARIX verification code is ${code}. It expires in ${CODE_TTL_MIN} minutes.`,
      html: `<p>Your <b>NOTARIX</b> verification code is:</p><p style="font-size:26px;font-weight:700;letter-spacing:6px;">${code}</p><p>This code expires in ${CODE_TTL_MIN} minutes. If you did not request it, you can ignore this email.</p>`
    });
    return { delivered: true };
  } catch (e) {
    return { delivered: false, error: 'Email could not be sent: ' + e.message };
  }
}

/* ---------------- Users (admin panel) ---------------- */
app.get('/api/users', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, name, email, role FROM users ORDER BY id').all());
});

/* Issue the code for the email being added as a staff account */
app.post('/api/verify-email', requireAdmin, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email)) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60000).toISOString();
  db.prepare(`INSERT INTO email_codes (email, code, expires_at) VALUES (?,?,?)
    ON CONFLICT(email) DO UPDATE SET code = excluded.code, used = 0, expires_at = excluded.expires_at`)
    .run(email, code, expiresAt);

  const result = await sendVerificationEmail(email, code);
  res.json({ ok: true, delivered: result.delivered, expiresAt, ...(!result.delivered ? { code } : {}), ...(result.error ? { error: result.error } : {}) });
});

app.post('/api/users', requireAdmin, (req, res) => {
  const { name, email, password, role, code } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  const mail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) return res.status(400).json({ error: 'Enter a valid email address' });

  const row = db.prepare('SELECT * FROM email_codes WHERE email = ? AND used = 0').get(mail);
  if (!row) return res.status(400).json({ error: 'No verification code was sent to this email — send the code first' });
  if (row.expires_at < new Date().toISOString()) {
    return res.status(400).json({ error: 'The verification code has expired — request a new one' });
  }
  if (String(code || '').trim() !== row.code) {
    return res.status(400).json({ error: 'Incorrect verification code — use the 6-digit code from the email' });
  }

  try {
    const info = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
      .run(name.trim(), mail, bcrypt.hashSync(password, 10), role || 'Staff');
    db.prepare('UPDATE email_codes SET used = 1 WHERE id = ?').run(row.id);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'A user with this email already exists' });
  }
});
app.delete('/api/users/:id', requireAdmin, (req, res) => {
  if (+req.params.id === req.session.userId) return res.status(400).json({ error: 'You cannot delete your own account' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Settings ---------------- */
app.get('/api/settings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});
app.post('/api/settings', requireAdmin, (req, res) => {
  const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  Object.entries(req.body).forEach(([k, v]) => ins.run(k, v));
  res.json({ ok: true });
});

/* Fallback: directory pages -> rewrite to their file */
const pages = ['index', 'login', 'dashboard', 'records', 'add-record', 'search', 'status', 'reports', 'document-types', 'users', 'settings'];
app.get('/:page', (req, res, next) => {
  const name = req.params.page;
  if (pages.includes(name)) return res.sendFile(path.join(__dirname, 'public', name + '.html'));
  next();
});

/* Upload / JSON error handler */
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large. Maximum size is 5 MB.' });
  if (err) return res.status(400).json({ error: err.message || 'Request failed' });
  next();
});

app.listen(PORT, () => console.log(`\n✔ NOTARIX running at http://localhost:${PORT}`));
