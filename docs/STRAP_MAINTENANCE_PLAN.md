# STRAP Maintenance — development plan

Sources: Rachid's emails (Oct 2026), `ATPERF_Brief_Site_Web_STRAP_Software_Maintenance` (23/10/2026),
`STRAP_Maintenance_Apercu_Discover.pdf` and `STRAP_Maintenance_Prototype_Donnees_Fictives_1.xlsx`.

## Decisions (validated)

| # | Topic | Decision |
|---|---|---|
| 1 | Week-1 demonstrator | Front-end-only simulator on the fictive dataset, public, no login |
| 2 | Cockpit access | Atperf staff + pilot clients enabled by staff |
| 3 | Symptom similarity | Rule-based symptom families only in V1 (no data sent to OpenAI) |
| 4 | Dedicated page | Yes: "Solutions digitales → STRAP Software → Maintenance" |
| 5 | "Contexte aggravant" criterion | Manual entry in V1 |
| 6 | Real SAP PM export headers | Not available yet — import mapping stays generic |
| 7 | Server-side auth / CORS | Done first, before any real data (Phase 0) |
| 8 | Content approval (FR + EN) | Rachid |

## Phase 1 — Public presence + simulator ✅ (this branch)

- **Discover section** (`components/maintenance/StrapMaintenanceSection.tsx`), inserted in
  `DiscoverStrAP.tsx` before the Offers section, following the Discover mockup: 3 flows →
  anticipation matrix → "prioriser les jaunes à risque de rouge" → cockpit, positioning,
  pilot status badge, CTA to the simulator, conceptual-preview disclaimer. FR + EN.
- **Dedicated page** `/strap-software/maintenance` (`StrapSoftwareMaintenancePage.tsx`), built
  from the brief: hook, context, STRAP method (AS-IS / TO-BE / Digitalisation), visual 1
  (three flows table), visual 2 (fictive timeline + pipeline), /100 matrix, visual 3 (fictive
  cockpit), visual 4 (validation loop), scope/status, benefits, positioning, CTA.
  `/strap-software` redirects there until other STRAP Software applications exist.
  "STRAP Software" added to the header and footer navigation.
- **Simulator** `/strap-software/maintenance/demo` (`StrapMaintenanceDemo.tsx`, `scoring.ts`,
  `FluxTimeline.tsx`), running entirely in the browser on `src/data/strapMaintenanceDemo.json`
  (exported from the Excel file, 100 % fictive):
  1. Overview — KPIs per flow, swimlane timeline per equipment.
  2. Prioritised yellows — ranked list, filters, notice sheet with score breakdown,
     drivers, earlier vs later red breakdowns, recorded matches, rule-based suggested checks,
     expert validate / reject / correct (kept in the browser only).
  3. Replay — pick a red breakdown, see preceding yellows, lead time, flagged or not, verdict.
  4. Alert measurement — coverage, alerts, alerts without later breakdown, breakdowns without
     precursor, median lead time, with threshold and horizon sliders.
  - Adjustable weights (sum must be 100) and thresholds; score = Σ (note / 5) × weight.
  - Notices raised after a breakdown are never treated as precursors (scenario T08).

Open point for Rachid: final wording review FR + EN on the three new screens.

## Phase 0 — Security prerequisite ✅

- Signed JWT sessions in httpOnly cookies (`atperf_user`, `atperf_staff`), logout endpoints,
  `/me` and `/staff/me`; accounts re-checked on every request (`backend/security.py`).
- Server-side checks on every non-public endpoint: own data only for users; Admin panel =
  staff or external admin; user/staff management = admin; deletion and `super_admin` grants =
  super admin; tool histories and AI calls bound to the session user, never the request body.
- StrAPilot's old `Authorization: Bearer <user_id>` scheme removed.
- CORS restricted to the site origins (`CORS_ORIGINS`).
- Rate limiting on login, OTP, registration, password reset, contact, comments, likes, AI and
  report e-mails; media uploads limited to images, videos and PDF.
- Database credentials removed from the code (env only).
- 38 backend tests (`backend/tests`) + end-to-end browser check of login, dashboard, logout,
  expired-session redirect and Admin panel.

## Phase 2 — Shared StrAP tools sidebar ✅

- `components/layout/ToolsLayout.tsx` wraps every logged-in tool page through a nested route
  (`<Route element={<ToolsLayout/>}>` + `<Outlet/>`): Dashboard, StrAP Perf Diagnostic
  (`/submit`), Decision Radar, StrAPilot, STRAP Maintenance (`/tool/strap-maintenance`,
  "Prototype" badge, staff only until the Phase 3 pilot flag), and Admin.
- Entries come from one config array (`components/layout/toolsNav.ts`).
- Desktop: fixed sidebar, collapsible to icons (remembered per browser). Mobile: top bar with
  the current page name and a drawer. Bottom: Admin (staff or external admin), EN/FR switch,
  profile, log out.
- One language setting for all tools (`utils/useLang.ts`): the sidebar switch updates the
  open tool immediately.
- The duplicated top bars of Dashboard, Diagnostic, Decision Radar, StrAPilot and Admin are
  removed; StrAPilot keeps its step-back control and step counter in the page.
- URLs are unchanged, so no redirects were needed. Public landing pages keep the site header;
  the header gains a "StrAP Tools" button for logged-in users.
- Fixed horizontal scrolling on phones for the Dashboard tabs and Admin sub-tabs.

## Phase 3 — STRAP Maintenance prototype ✅

**Access** — Atperf staff see every dataset; users of a company with the new
`companies.maintenance_pilot` flag see their own company's datasets only. Only staff can switch
the flag (Admin → Companies → "STRAP Maintenance" column). The sidebar entry appears for staff
and pilot users; the cached profile is refreshed from `/me` so a newly enabled pilot sees it
without logging in again. The column is added automatically at API start-up (`ensure_columns`
in `main.py`) and also in `migrate_db.py`.

**Backend** — `backend/maintenance/engine.py` (scoring, links, replay, backtest),
`backend/maintenance/importer.py` (Excel / CSV, mapping, validation report),
`backend/api/strap_maintenance.py` (`/api/maintenance/...`). Tables: `maint_datasets`,
`maint_equipments`, `maint_notices`, `maint_work_orders`, `maint_links` (matches from the
imported file) and `maint_decisions` (audit log of validations, rejections, corrections and
parameter changes, with the score at the time). Scores are computed on demand rather than
stored, so they always reflect the current parameters; the decision log keeps a snapshot.

**Import** — one Excel workbook (one sheet per table) or up to four CSV files; tables and
columns detected from French / English / SAP-style names, editable before import. Report lists
skipped rows (missing date or identifier, undefined flow, duplicates) and assets created because
they were missing from the reference list. The fictive workbook is bundled
(`backend/maintenance/sample/`) and loadable in one click.

**Scoring (as of date T, data before T only)**

| Criterion | Pts | V1 rule |
|---|---|---|
| Criticality | 25 | Reference list (critique 5, élevée 4, moyenne 3, faible 1; 3 if missing) |
| Recurrence | 20 | Earlier yellow notices on the same asset within 180 days (capped at 5) |
| Historical similarity | 20 | Earlier red WO on the same asset: 5 same symptom family, 3 other family; 2 same sub-assembly + family |
| Age / postponements | 15 | 0–3 by age (≥15 / 45 / 90 days) + 1 if postponed, +2 if ≥3 postponements |
| Symptom severity | 10 | By family (thermal / pressure 4; sealing / vibration / flow / mechanical 3; electrical 2) +1 if worsening |
| Aggravating context | 10 | Manual entry by an expert |

Symptom families come from a keyword table (sealing, pressure, vibration, mechanical, thermal,
electrical, flow). Experts can override any note; overrides are logged and shown in the sheet.
Limit: the number of postponements is only known as a final count.

**Links** — candidate yellow → red when earlier, within 90 days, and same asset (strong if a
symptom family is shared, medium otherwise) or same sub-assembly with a shared family (weak).
Imported matches are shown with their status. Experts validate or reject each one.

**Replay / backtest** — each notice is rescored as in a weekly review using only data known
on that date. Replay shows, for one breakdown, the precursors, their score at creation and the
day before, and when they would first have been flagged. Backtest reports coverage, alerts,
alerts with no later breakdown, breakdowns without precursor and median lead time, with
threshold and horizon sliders.

**Cockpit** (`/tool/strap-maintenance`, inside the tools sidebar) — datasets list, import
wizard, then per dataset: Overview (KPIs + timeline), Prioritised yellows (filters, sheet with
explanations, history, links, suggested checks, validate / reject / correct), Replay, Alert
measurement, Parameters (weights must total 100, thresholds, windows, rules), Log, Excel export.

**Tests** — 18 new backend tests (56 in total): access rules, pilot flag, CSV import and
report, scenarios T01–T10 from the workbook (T08: removing every record after T leaves past
scores unchanged), replay, backtest, export, deletion. End-to-end browser run: staff enables
the pilot, loads the fictive dataset, corrects and validates a notice, replays, measures,
saves parameters, exports, imports two CSV files; the pilot client sees only its company.

**First calibration result on the fictive data** — with the automatic rules and no context
entered, the 75/100 threshold flags 1 of 36 breakdowns (10 alerts); around 55–60 it covers
15–19 of 36 with ~40 alerts not followed by a breakdown. The fictive workbook's notes were set
by hand, so the rules need calibrating with a maintenance expert on real history — which is what
the Parameters and Alert-measurement tabs are for.

Out of scope V1: real-time SAP, automatic WO creation, LCC economics, PDF export (Excel only).

## Estimate

| Work | Days | Status |
|---|---|---|
| 1. Discover section + dedicated page + simulator | 4–5 | ✅ done |
| 0. Auth / CORS / rate limiting | 2–3 | ✅ done |
| 2. Sidebar + route migration | 2–3 | ✅ done |
| 3. Data model + import + mapping | 3–4 | ✅ done |
| 3. Scoring + links engines | 3–4 | ✅ done |
| 3. Replay / backtest | 2–3 | ✅ done |
| 3. Cockpit UI (reusing simulator components) | 4–5 | ✅ done |
| 3. Expert validation + audit log | 2 | ✅ done |
| Tests, translations, QA, deployment | 2–3 | ✅ done |
| **Remaining** | **Deployment + pilot calibration** | |
