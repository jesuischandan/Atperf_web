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

## Phase 2 — Shared StrAP tools sidebar (2–3 days)

- `ToolsLayout` with a sidebar for every authenticated tool page via nested routes
  (`<Route element={<ToolsLayout/>}>` + `<Outlet/>`): Dashboard, StrAP Perf Diagnostic,
  Decision Radar, StrAPilot, ProExtract, STRAP Maintenance (Cockpit, Import, Replay,
  Parameters; "Prototype" badge; visible only to staff and enabled pilot clients),
  then Admin (role-based), language, profile, log out.
- Collapsible to icons (remembered), drawer on mobile, active state, driven by one config array.
- Replaces the duplicated top bars in Dashboard, StrapDiag, Strapilot, DecisionRadar, SubmitForm.
- Public marketing pages keep the public header and footer; old URLs redirect.

## Phase 3 — STRAP Maintenance prototype (≈ 4 weeks)

**Backend** — `api/strap_maintenance.py`; tables `maint_datasets`, `maint_equipments`,
`maint_notices`, `maint_work_orders`, `maint_links`, `maint_scoring_configs` (versioned),
`maint_scores` (per notice, per as-of date, per-criterion breakdown), `maint_expert_validations`
(audit log). All rows scoped by company; access = staff + pilot clients (new
`maintenance_pilot` flag on companies, toggled in the Admin panel).

**Import** — Excel / CSV with pandas; generic column-mapping step (StrAPilot pattern) since no
real SAP PM headers are available yet; validation report (missing dates, unknown equipment,
undefined flow).

**Scoring engine** — deterministic Python, as-of date T (no future data):

| Criterion | Pts | V1 rule |
|---|---|---|
| Criticality | 25 | Equipment reference list |
| Recurrence | 20 | Earlier notices on same equipment / sub-assembly in a window |
| Historical similarity | 20 | Earlier red WOs with a matching symptom family (rule table) |
| Age / postponements | 15 | Age at T + number of postponements |
| Symptom severity | 10 | Business rules on symptom text |
| Aggravating context | 10 | Manual entry |

Expert overrides of any note are logged. Weights and thresholds configurable per dataset.

**Links engine** — candidate yellow → red when earlier date, same equipment or sub-assembly,
within a window and compatible symptom family; always a hypothesis until an expert decides.

**Replay / backtest** — score precursors at several as-of dates; coverage, false alerts,
undetectable breakdowns, threshold trade-off.

**Cockpit UI** — same screens as the Phase 1 simulator, backed by the API, plus import,
persisted expert decisions, decision history and Excel / PDF export.

**Tests** — scenarios T01–T10 from the Excel file as automated tests (T08 critical).

Out of scope V1: real-time SAP, automatic WO creation, LCC economics.

## Estimate

| Work | Days | Status |
|---|---|---|
| 1. Discover section + dedicated page + simulator | 4–5 | ✅ done |
| 0. Auth / CORS / rate limiting | 2–3 | ✅ done |
| 2. Sidebar + route migration | 2–3 | next |
| 3. Data model + import + mapping | 3–4 | |
| 3. Scoring + links engines | 3–4 | |
| 3. Replay / backtest | 2–3 | |
| 3. Cockpit UI (reusing simulator components) | 4–5 | |
| 3. Expert validation + audit log | 2 | |
| Tests, translations, QA, deployment | 2–3 | |
| **Remaining** | **≈ 18–24 days** | |
