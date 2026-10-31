"""
STRAP Maintenance — deterministic scoring, link and backtest engine.

Everything is computed "as of" a date T using only records dated before T, so
replaying history never leaks a future breakdown into a past score (test T08).
No AI: every note comes from an explicit rule and is returned with its evidence.

Known limit: the number of postponements is only available as a final count
(no history of when each postponement happened), so it is used as-is.
"""
from __future__ import annotations

import bisect
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

CRITERIA = ("criticality", "recurrence", "similarity", "age", "severity", "context")

DEFAULT_WEIGHTS = {"criticality": 25, "recurrence": 20, "similarity": 20, "age": 15, "severity": 10, "context": 10}
DEFAULT_THRESHOLDS = {"high": 75, "medium": 50}
DEFAULT_WINDOWS = {
    "recurrence_days": 180,   # earlier notices on the same asset counted for recurrence
    "similarity_days": 365,   # earlier breakdowns considered for similarity
    "link_days": 90,          # max delay yellow notice → red breakdown for a candidate link
    "review_every_days": 7,   # backtest: notices are reviewed weekly while open
    "horizon_days": 90,       # backtest: an alert counts if a breakdown follows within this horizon
}


# ── Symptom families (rule table, V1) ─────────────────────────────────────────
# Keyword (accent-free, lowercase) → family. A text may belong to several families.
FAMILY_KEYWORDS: list[tuple[str, str]] = [
    ("fuite", "sealing"), ("joint", "sealing"), ("etanch", "sealing"), ("leak", "sealing"),
    ("pression", "pressure"), ("pressure", "pressure"),
    ("vibration", "vibration"), ("roulement", "vibration"), ("bearing", "vibration"),
    ("bruit", "mechanical"), ("blocage", "mechanical"), ("transmission", "mechanical"), ("jeu", "mechanical"),
    ("rupture", "mechanical"), ("desserrage", "mechanical"), ("mecanique", "mechanical"), ("noise", "mechanical"),
    ("temperature", "thermal"), ("surchauffe", "thermal"), ("echauffement", "thermal"),
    ("refroidissement", "thermal"), ("overheat", "thermal"),
    ("capteur", "electrical"), ("connectique", "electrical"), ("electrique", "electrical"), ("sensor", "electrical"),
    ("debit", "flow"), ("colmatage", "flow"), ("flow", "flow"),
]
FAMILY_LABELS = {
    "sealing": {"fr": "Étanchéité / fuite", "en": "Sealing / leak"},
    "pressure": {"fr": "Pression", "en": "Pressure"},
    "vibration": {"fr": "Vibration / roulements", "en": "Vibration / bearings"},
    "mechanical": {"fr": "Mécanique / transmission", "en": "Mechanical / transmission"},
    "thermal": {"fr": "Thermique", "en": "Thermal"},
    "electrical": {"fr": "Électrique / instrumentation", "en": "Electrical / instrumentation"},
    "flow": {"fr": "Débit / colmatage", "en": "Flow / clogging"},
}
FAMILY_SEVERITY = {"thermal": 4, "pressure": 4, "sealing": 3, "vibration": 3, "flow": 3, "mechanical": 3, "electrical": 2}
SEVERITY_BOOSTERS = ("aggrav", "accru", "fort", "repet", "permanent", "important", "increas", "severe")

SUGGESTED_CHECKS = {
    "sealing": {"fr": "Contrôler étanchéité, joints et niveau d’huile ; planifier le remplacement du joint à la prochaine fenêtre.",
                "en": "Check sealing, gaskets and oil level; plan seal replacement at the next window."},
    "pressure": {"fr": "Contrôler le circuit hydraulique, rechercher une fuite interne, vérifier les capteurs de pression.",
                 "en": "Check the hydraulic circuit, look for an internal leak, verify pressure sensors."},
    "vibration": {"fr": "Mesure vibratoire ; contrôle roulements, alignement et fixations.",
                  "en": "Vibration measurement; check bearings, alignment and fixings."},
    "mechanical": {"fr": "Inspection mécanique ; contrôle transmission, serrages et usure des accouplements.",
                   "en": "Mechanical inspection; check transmission, tightening and coupling wear."},
    "thermal": {"fr": "Thermographie ; contrôle du refroidissement et de la ventilation.",
                "en": "Thermography; check cooling and ventilation."},
    "electrical": {"fr": "Contrôle connectique et câblage ; étalonnage du capteur.",
                   "en": "Check connectors and wiring; calibrate the sensor."},
    "flow": {"fr": "Contrôle filtres et colmatage ; vérification de la pompe.",
             "en": "Check filters and clogging; verify the pump."},
}

CRITICALITY_LABELS = {"critique": 5, "critical": 5, "elevee": 4, "high": 4, "haute": 4, "moyenne": 3, "medium": 3,
                      "faible": 1, "low": 1, "a": 5, "b": 3, "c": 1}


def normalize(text: Optional[str]) -> str:
    text = unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", text)).strip()


def _has_word(tokens: list[str], prefix: str) -> bool:
    return any(tok.startswith(prefix) for tok in tokens)


def families(*texts: Optional[str]) -> set[str]:
    tokens = normalize(" ".join(x or "" for x in texts)).split()
    return {fam for kw, fam in FAMILY_KEYWORDS if _has_word(tokens, kw)}


def criticality_note(label: Optional[str], note: Optional[float]) -> int:
    if note is not None:
        return max(0, min(5, int(round(note))))
    return CRITICALITY_LABELS.get(normalize(label), 3)


# ── Data ──────────────────────────────────────────────────────────────────────
@dataclass
class Equipment:
    code: str
    name: str = ""
    tag: str = ""
    subsystem: str = ""
    criticality_label: str = ""
    criticality_note: Optional[float] = None


@dataclass
class Notice:
    code: str
    date: date
    equipment: str
    flux: str
    symptom: str = ""
    description: str = ""
    category: str = ""
    status: str = ""
    postponements: int = 0
    issuer: str = ""
    context_note: Optional[int] = None
    overrides: dict = field(default_factory=dict)

    @property
    def is_closed(self) -> bool:
        return normalize(self.status) in ("cloture", "closed", "clos", "termine", "teco")


@dataclass
class WorkOrder:
    code: str
    date: date
    equipment: str
    flux: str
    type: str = ""
    symptom: str = ""
    cause: str = ""
    downtime_hours: Optional[float] = None
    status: str = ""
    linked_notice: Optional[str] = None


@dataclass
class Config:
    weights: dict = field(default_factory=lambda: dict(DEFAULT_WEIGHTS))
    thresholds: dict = field(default_factory=lambda: dict(DEFAULT_THRESHOLDS))
    windows: dict = field(default_factory=lambda: dict(DEFAULT_WINDOWS))

    @classmethod
    def from_dicts(cls, weights=None, thresholds=None, windows=None) -> "Config":
        return cls({**DEFAULT_WEIGHTS, **(weights or {})}, {**DEFAULT_THRESHOLDS, **(thresholds or {})},
                   {**DEFAULT_WINDOWS, **(windows or {})})


@dataclass
class Evidence:
    note: int
    reason: str            # short machine key, e.g. "prior_notices"
    detail: dict           # values to render the explanation
    overridden: bool = False


@dataclass
class Scored:
    notice: Notice
    as_of: date
    notes: dict
    evidence: dict
    score: int
    priority: str          # HIGH / MEDIUM / LOW


# ── Engine ────────────────────────────────────────────────────────────────────
class Engine:
    def __init__(self, equipments: list[Equipment], notices: list[Notice], work_orders: list[WorkOrder], config: Config):
        self.config = config
        self.equipments = {e.code: e for e in equipments}
        self.notices = sorted(notices, key=lambda n: (n.date, n.code))
        self.work_orders = sorted(work_orders, key=lambda o: (o.date, o.code))
        self.yellows = [n for n in self.notices if n.flux == "JAUNE"]
        self.reds = [o for o in self.work_orders if o.flux == "ROUGE"]
        self.notice_by_code = {n.code: n for n in self.notices}
        self.wo_by_code = {o.code: o for o in self.work_orders}

        self._yellow_dates: dict[str, list[date]] = {}
        for n in self.yellows:
            self._yellow_dates.setdefault(n.equipment, []).append(n.date)
        self._reds_by_eq: dict[str, list[WorkOrder]] = {}
        for o in self.reds:
            self._reds_by_eq.setdefault(o.equipment, []).append(o)
        self._red_families = {o.code: families(o.symptom, o.cause) for o in self.reds}

    # helpers
    def equipment(self, code: str) -> Equipment:
        return self.equipments.get(code) or Equipment(code=code)

    def subsystem(self, eq_code: str) -> str:
        return normalize(self.equipment(eq_code).subsystem)

    def notice_families(self, n: Notice) -> set[str]:
        return families(n.symptom, n.description)

    # notes
    def _criticality(self, n: Notice) -> Evidence:
        e = self.equipment(n.equipment)
        note = criticality_note(e.criticality_label, e.criticality_note)
        return Evidence(note, "equipment_criticality", {"equipment": e.tag or e.code, "label": e.criticality_label or None})

    def _recurrence(self, n: Notice) -> Evidence:
        days = self.config.windows["recurrence_days"]
        dates = self._yellow_dates.get(n.equipment, [])
        lo = bisect.bisect_left(dates, n.date - timedelta(days=days))
        hi = bisect.bisect_left(dates, n.date)       # strictly earlier notices only
        count = hi - lo
        return Evidence(min(5, count), "prior_notices", {"count": count, "days": days})

    def _similarity(self, n: Notice, as_of: date) -> Evidence:
        days = self.config.windows["similarity_days"]
        fams = self.notice_families(n)
        start = as_of - timedelta(days=days)
        best: tuple[int, Optional[WorkOrder], str] = (0, None, "none")
        same_eq = [o for o in self._reds_by_eq.get(n.equipment, []) if start <= o.date < as_of]
        for o in same_eq:
            if fams & self._red_families[o.code]:
                best = max(best, (5, o, "same_asset_same_family"), key=lambda b: b[0])
            else:
                best = max(best, (3, o, "same_asset_other_family"), key=lambda b: b[0])
        if best[0] < 2 and fams:
            sub = self.subsystem(n.equipment)
            if sub:
                for o in self.reds:
                    if start <= o.date < as_of and o.equipment != n.equipment and self.subsystem(o.equipment) == sub \
                            and fams & self._red_families[o.code]:
                        best = (2, o, "same_subsystem_same_family")
                        break
        note, wo, reason = best
        detail = {"families": sorted(fams), "days": days}
        if wo:
            detail.update({"work_order": wo.code, "date": wo.date.isoformat(), "symptom": wo.symptom,
                           "equipment": self.equipment(wo.equipment).tag or wo.equipment})
        return Evidence(note, reason, detail)

    def _age(self, n: Notice, as_of: date) -> Evidence:
        age = max(0, (as_of - n.date).days)
        base = 3 if age >= 90 else 2 if age >= 45 else 1 if age >= 15 else 0
        bonus = 2 if n.postponements >= 3 else 1 if n.postponements >= 1 else 0
        return Evidence(min(5, base + bonus), "age_postponements", {"age_days": age, "postponements": n.postponements})

    def _severity(self, n: Notice) -> Evidence:
        fams = self.notice_families(n)
        base = max((FAMILY_SEVERITY[f] for f in fams), default=2)
        tokens = normalize(f"{n.symptom} {n.description}").split()
        boosted = any(_has_word(tokens, b) for b in SEVERITY_BOOSTERS)
        return Evidence(min(5, base + (1 if boosted else 0)), "symptom_rules", {"families": sorted(fams), "aggravated": boosted})

    def _context(self, n: Notice) -> Evidence:
        if n.context_note is None:
            return Evidence(0, "context_not_entered", {})
        return Evidence(max(0, min(5, int(n.context_note))), "context_manual", {})

    def score_notice(self, n: Notice, as_of: date) -> Scored:
        ev = {
            "criticality": self._criticality(n),
            "recurrence": self._recurrence(n),
            "similarity": self._similarity(n, as_of),
            "age": self._age(n, as_of),
            "severity": self._severity(n),
            "context": self._context(n),
        }
        for crit, value in (n.overrides or {}).items():
            if crit in ev and value is not None:
                ev[crit] = Evidence(max(0, min(5, int(value))), "expert_override",
                                    {"computed": ev[crit].note, "computed_reason": ev[crit].reason}, overridden=True)
        notes = {c: ev[c].note for c in CRITERIA}
        return Scored(n, as_of, notes, ev, self.total(notes), self.classify(self.total(notes)))

    def total(self, notes: dict) -> int:
        w = self.config.weights
        return int(round(sum(notes[c] / 5 * w.get(c, 0) for c in CRITERIA)))

    def classify(self, score: int) -> str:
        t = self.config.thresholds
        return "HIGH" if score >= t["high"] else "MEDIUM" if score >= t["medium"] else "LOW"

    def score_all(self, as_of: date) -> list[Scored]:
        """Yellow notices known at `as_of`, ranked by score."""
        out = [self.score_notice(n, as_of) for n in self.yellows if n.date <= as_of]
        return sorted(out, key=lambda s: (-s.score, s.notice.date, s.notice.code))

    # links
    def candidate_links(self, wo: WorkOrder) -> list[dict]:
        days = self.config.windows["link_days"]
        wo_fams = self._red_families.get(wo.code) or families(wo.symptom, wo.cause)
        sub = self.subsystem(wo.equipment)
        out = []
        for n in self.yellows:
            lead = (wo.date - n.date).days
            if not (0 < lead <= days):
                continue
            shared = sorted(self.notice_families(n) & wo_fams)
            if n.equipment == wo.equipment:
                confidence = "strong" if shared else "medium"
            elif sub and self.subsystem(n.equipment) == sub and shared:
                confidence = "weak"
            else:
                continue
            out.append({"notice": n.code, "work_order": wo.code, "lead_days": lead, "confidence": confidence,
                        "same_equipment": n.equipment == wo.equipment, "shared_families": shared})
        order = {"strong": 0, "medium": 1, "weak": 2}
        return sorted(out, key=lambda c: (order[c["confidence"]], c["lead_days"]))

    # backtest
    def review_dates(self, n: Notice, until: date) -> list[date]:
        step = max(1, int(self.config.windows["review_every_days"]))
        d, out = n.date, []
        while d < until:
            out.append(d)
            d += timedelta(days=step)
        return out

    def first_flag(self, n: Notice, threshold: int, until: date) -> Optional[tuple[date, int]]:
        """First weekly review before `until` where the notice reaches `threshold`."""
        for d in self.review_dates(n, until):
            s = self.score_notice(n, d)
            if s.score >= threshold:
                return d, s.score
        return None

    def replay(self, wo: WorkOrder, threshold: Optional[int] = None) -> dict:
        threshold = threshold if threshold is not None else self.config.thresholds["high"]
        rows = []
        for c in self.candidate_links(wo):
            n = self.notice_by_code[c["notice"]]
            before = self.score_notice(n, wo.date - timedelta(days=1))
            at_creation = self.score_notice(n, n.date)
            flag = self.first_flag(n, threshold, wo.date)
            rows.append({**c,
                         "score_at_creation": at_creation.score,
                         "score_before_failure": before.score,
                         "priority_before_failure": before.priority,
                         "flagged_on": flag[0].isoformat() if flag else None,
                         "flag_lead_days": (wo.date - flag[0]).days if flag else None})
        flagged = [r for r in rows if r["flagged_on"] and r["same_equipment"]]
        best_lead = max((r["flag_lead_days"] for r in flagged), default=None)
        verdict = "flagged" if flagged else ("below_threshold" if any(r["same_equipment"] for r in rows) else "no_precursor")
        return {"work_order": wo.code, "threshold": threshold, "verdict": verdict, "best_lead_days": best_lead, "precursors": rows}

    def backtest(self, threshold: Optional[int] = None, horizon_days: Optional[int] = None, as_of: Optional[date] = None) -> dict:
        threshold = threshold if threshold is not None else self.config.thresholds["high"]
        horizon = horizon_days if horizon_days is not None else self.config.windows["horizon_days"]
        as_of = as_of or self.study_date()

        flags: dict[str, tuple[date, int]] = {}
        for n in self.yellows:
            if n.date > as_of:
                continue
            f = self.first_flag(n, threshold, min(as_of + timedelta(days=1), n.date + timedelta(days=horizon)))
            if f:
                flags[n.code] = f

        covered, no_precursor, leads, per_red = 0, 0, [], []
        for wo in self.reds:
            if wo.date > as_of:
                continue
            same_eq = [n for n in self.yellows if n.equipment == wo.equipment and 0 < (wo.date - n.date).days <= horizon]
            if not same_eq:
                no_precursor += 1
            hits = [(n, flags[n.code]) for n in same_eq if n.code in flags and flags[n.code][0] < wo.date]
            lead = max(((wo.date - f[0]).days for _, f in hits), default=None)
            if hits:
                covered += 1
                leads.append(lead)
            per_red.append({"work_order": wo.code, "covered": bool(hits), "lead_days": lead, "precursors": len(same_eq)})

        false_alerts = []
        for code, (d, s) in flags.items():
            n = self.notice_by_code[code]
            followed = any(o.equipment == n.equipment and d < o.date <= d + timedelta(days=horizon) for o in self.reds)
            if not followed:
                false_alerts.append({"notice": code, "flagged_on": d.isoformat(), "score": s})

        leads.sort()
        reds = len(per_red)
        return {
            "threshold": threshold, "horizon_days": horizon, "as_of": as_of.isoformat(),
            "reds": reds, "covered": covered, "coverage": round(covered / reds, 3) if reds else None,
            "alerts": len(flags), "false_alerts": len(false_alerts),
            "false_alert_rate": round(len(false_alerts) / len(flags), 3) if flags else None,
            "no_precursor": no_precursor,
            "median_lead_days": leads[len(leads) // 2] if leads else None,
            "per_red": per_red, "false_alert_list": sorted(false_alerts, key=lambda f: -f["score"]),
        }

    def study_date(self) -> date:
        dates = [n.date for n in self.notices] + [o.date for o in self.work_orders]
        return max(dates) if dates else date.today()


def suggested_checks(n: Notice, lang: str = "fr") -> list[str]:
    fams = families(n.symptom, n.description)
    return [SUGGESTED_CHECKS[f][lang] for f in sorted(fams) if f in SUGGESTED_CHECKS]


def validate_config(weights: dict, thresholds: dict, windows: dict) -> list[str]:
    errors = []
    if set(weights) != set(CRITERIA):
        errors.append("weights must define every criterion")
    elif any(not isinstance(v, (int, float)) or v < 0 for v in weights.values()):
        errors.append("weights must be positive numbers")
    elif round(sum(weights.values())) != 100:
        errors.append("weights must add up to 100")
    hi, med = thresholds.get("high"), thresholds.get("medium")
    if not (isinstance(hi, (int, float)) and isinstance(med, (int, float)) and 0 < med < hi <= 100):
        errors.append("thresholds must satisfy 0 < medium < high <= 100")
    for k, v in windows.items():
        if k not in DEFAULT_WINDOWS or not isinstance(v, (int, float)) or not (1 <= v <= 3650):
            errors.append(f"invalid window {k}")
    return errors
