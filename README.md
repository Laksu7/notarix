# NOTARIX — Digitalized Notarization Record Management System

A web-based system for the law office that lets authorized staff digitally record, organize, and trace notarized documents instead of relying only on handwritten book records.

## Panels & Roles
- **Admin Panel** — manage secretary/staff accounts, view all notarization records, add/edit records, check duplicate document numbers, track status & location, generate monthly reports, manage system settings.
- **Secretary Panel** — add notarization records, check document numbers, search/retrieve records, update records, track document status/location, view & export reports.

Sign in works with either the **username (full name)** or the **email address**.

### Default accounts (seeded automatically)
| Account | Username or Email | Password | Role |
|---|---|---|---|
| Administrator | `admin@notarium.com` (or "Administrator") | `admin123` | Admin |

Additional staff accounts are created by the administrator on **Staff Accounts** — each new account email must be verified with a 6-digit code before it can be created.

## Features
1. **Login** — session authentication with bcrypt hashes, password visibility toggle, validation, and loading feedback.
2. **Dashboard** — *Notarization Overview*: total records (with change vs. last month), records this month, documents *For Submission*, *Submitted* count, recent notarization records with view/edit/delete actions and working pagination, plus a Quick Search & Filters panel (keyword, document type, status, date range) and a per-month document-type summary. Records start empty so the office can begin from real data.
3. **Add Notarization Record** — document number, document type, client name, date notarized, status, location, remarks, and an optional document upload.
4. **Document Number Checking** — live duplicate check while typing; the same number cannot be recorded twice.
5. **Organized Records** — every record is stored in SQLite and displayed in a clean, paginated table.
6. **Search & Record Retrieval** — search by document number, document type, client name, or date range (with filters).
7. **Update / Edit** — staff can correct miswritten information.
8. **Status & Location Tracking** — documents carry both a workflow *status* (In Office, Submitted, Main Office, Others) and a physical *location*; both update inline without editing the whole record.
9. **Monthly Reports** — summary cards, per-day chart, and **Export PDF / Export Excel (CSV)**.
10. **Role-based access** — staff accounts, document-type registry, and office settings are administrator-only (enforced in the API as well as the UI).
11. **Email verification for new staff accounts** — before an account can be created, the administrator issues a 6-digit code for the staff member's email (valid 10 minutes), and the code must be entered to confirm the address. Any email provider can be used. Outgoing mail is optional: without an SMTP server configured in the settings table (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from`) the code is shown on screen; when configured it is emailed automatically.

## Getting Started
```bash
npm install
npm start
```
Open **http://localhost:3000** in your browser.

## Project Structure
```
├── server.js          # Express server + REST API (auth, records, stats, reports, admin routes)
├── db.js              # SQLite setup, location migration, sample data seeding
├── notarium.db        # SQLite database (created automatically)
├── uploads/           # Uploaded documents (created automatically)
└── public/
    ├── index.html          # Landing page
    ├── login.html          # Login screen (blurred legal-office theme)
    ├── dashboard.html      # Overview, metrics, recent records, quick search
    ├── records.html        # Records list with filters & tracking shortcut
    ├── add-record.html     # Add / edit record with live duplicate checking
    ├── search.html         # Search & retrieval (accepts quick-search parameters)
    ├── status.html         # Status / location tracking (inline updates)
    ├── reports.html        # Monthly report + exports
    ├── users.html          # Staff accounts (admin only)
    ├── document-types.html # Document type registry
    ├── settings.html       # Office settings (admin only, read-only for staff)
    ├── css/style.css       # Shared theme (navy / forest green / gold / ivory)
    └── js/app.js           # Shared layout, role-aware navigation, NOTARIX logo, helpers
```

## Technology
- **Node.js + Express** — REST API server
- **SQLite (`node:sqlite`)** — records database, WAL mode
- **Session auth + bcrypt** — protected pages
- **Chart.js (CDN)** — report chart

> Note: the report chart loads Chart.js from a CDN, so an internet connection is needed for the graph to appear. Everything else — including the login page background, logo, and icons — is rendered locally and works fully offline.
