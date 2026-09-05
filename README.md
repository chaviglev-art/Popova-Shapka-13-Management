# Попова шапка 13 — Building Portal

A bilingual (BG / EN), mobile-first web portal for the owners' association at ul. „Попова шапка" 13, Sofia.
No build step, no backend, no dependencies — open `index.html` or host on GitHub Pages.

## Roles
- **Building manager (admin)** — records payments & expenses, manages units/owners and their access, posts news, runs votes, answers requests, keeps documents and contacts, exports backups.
- **Owner (resident)** — sees their statement and building finances, submits requests with photos, votes, reads news/documents, finds neighbours & useful contacts, edits their profile.

## Features
Dashboard with KPIs & charts · Payment calendar (matrix) · Statements & running balance · Expenses by category · Requests with priority, photo, thread & status · Votes with quorum & turnout · News, banner & works progress · Calendar · Documents · Directory · Notifications · Audit log · JSON backup / CSV export · Light/dark theme · EN/BG switch · Installable on phone (PWA manifest).

## First login
- Admin: `admin` / `Popova13` — you are forced to set a new password and receive a **recovery code** (keep it!). If you forget the password, use *Forgot password?* on the login screen with that code.
- Owners: the manager creates units and generates passwords in **Units & owners**.

## Data
Data lives in the browser's `localStorage` (key `popova13_data`). Data from the previous version of the app is migrated automatically on first load (admin password is reset). Download a backup regularly from **Settings → Backup**.

## Structure
```
index.html            shell
css/styles.css        design system (light/dark, responsive)
js/i18n.js            EN/BG dictionaries
js/store.js           data model, migration, hashing, finance helpers
js/charts.js          dependency-free SVG charts
js/pages.js           all screens
js/app.js             shell, auth, routing, modals, notifications
assets/               logo & illustration (original SVG)
legacy/index.html     the previous single-file version
```
