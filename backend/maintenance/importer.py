"""
STRAP Maintenance — Excel / CSV import with generic column mapping.

No real SAP PM export headers are available yet, so columns are matched against
French / English / SAP-style synonyms and the user can correct the mapping
before committing. Every skipped or adjusted row is reported.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

import pandas as pd

from .engine import normalize

TABLES = ("equipments", "notices", "work_orders", "links")

# field → (required, synonyms). Synonyms are compared after normalize().
FIELDS: dict[str, dict[str, tuple[bool, list[str]]]] = {
    "equipments": {
        "code": (True, ["id equipement", "code equipement", "equipement", "equipment id", "equipment", "poste technique", "technical object", "functional location", "id"]),
        "name": (False, ["nom equipement", "designation", "equipment name", "description equipement", "nom", "name", "description"]),
        "tag": (False, ["repere", "tag", "reference"]),
        "subsystem": (False, ["sous ensemble", "subsystem", "sub assembly", "famille", "family", "groupe"]),
        "criticality_label": (False, ["criticite", "criticality", "indicateur abc", "abc indicator", "abc"]),
        "criticality_note": (False, ["note 0 5", "note criticite", "criticality score", "note"]),
    },
    "notices": {
        "code": (True, ["id avis", "numero avis", "n avis", "avis", "notification", "notification number", "id"]),
        "date": (True, ["date creation", "date avis", "created on", "date de creation", "date"]),
        "equipment": (True, ["id equipement", "equipement", "equipment id", "equipment", "poste technique", "technical object", "repere"]),
        "flux": (False, ["flux", "flow", "couleur", "color"]),
        "category": (False, ["categorie", "category", "type avis", "notification type", "type"]),
        "symptom": (True, ["symptome court", "symptome", "symptom", "texte court", "short text", "description courte"]),
        "description": (False, ["description avis", "description", "texte long", "long text"]),
        "status": (False, ["statut", "status", "statut systeme", "system status"]),
        "postponements": (False, ["nb reports", "nombre de reports", "reports", "postponements"]),
        "issuer": (False, ["emetteur", "auteur", "reported by", "created by"]),
        "context_note": (False, ["contexte", "note contexte", "context"]),
    },
    "work_orders": {
        "code": (True, ["id ot", "numero ot", "n ot", "ot", "ordre", "order", "work order", "id"]),
        "date": (True, ["date ot", "date debut", "basic start", "date de creation", "created on", "date"]),
        "equipment": (True, ["id equipement", "equipement", "equipment id", "equipment", "poste technique", "technical object", "repere"]),
        "flux": (False, ["flux", "flow", "couleur", "color"]),
        "type": (False, ["type ot", "order type", "type"]),
        "symptom": (False, ["symptome panne travail", "symptome", "symptom", "description", "texte court", "short text"]),
        "cause": (False, ["cause identifiee", "cause", "cause code", "code cause"]),
        "downtime_hours": (False, ["duree arret h", "duree arret", "downtime", "arret h", "heures arret"]),
        "status": (False, ["statut", "status"]),
        "linked_notice": (False, ["avis lie administrativement", "avis lie", "notification", "avis"]),
    },
    "links": {
        "notice": (True, ["avis jaune anterieur", "avis jaune", "avis", "notification"]),
        "work_order": (True, ["ot rouge ulterieur", "ot rouge", "ot", "work order", "ordre"]),
        "expert_status": (False, ["statut expertise", "statut", "status", "expert status"]),
    },
}

SHEET_HINTS = {
    "equipments": ["equip", "asset", "poste"],
    "notices": ["avis", "notif"],
    "work_orders": ["ot", "order", "ordre", "work"],
    "links": ["lien", "link"],
}

FLUX_WORDS = {
    "ROUGE": ["rouge", "red", "panne", "urgent", "urgence", "correctif", "breakdown"],
    "VERT": ["vert", "green", "preventif", "preventive", "planifie", "planned", "systematique"],
    "JAUNE": ["jaune", "yellow", "differe", "deferred", "opportunite", "opportunity", "replanifier", "reporte"],
}


@dataclass
class Source:
    name: str
    frame: pd.DataFrame


@dataclass
class ImportResult:
    equipments: list[dict] = field(default_factory=list)
    notices: list[dict] = field(default_factory=list)
    work_orders: list[dict] = field(default_factory=list)
    links: list[dict] = field(default_factory=list)
    issues: list[dict] = field(default_factory=list)
    counts: dict = field(default_factory=dict)

    def report(self) -> dict:
        return {"counts": self.counts, "issues": self.issues[:300], "issue_count": len(self.issues)}


# ── Reading ───────────────────────────────────────────────────────────────────
def read_sources(files: list[tuple[str, bytes]]) -> list[Source]:
    """Excel workbooks contribute one source per sheet; CSV files one source each."""
    sources: list[Source] = []
    for filename, content in files:
        lower = filename.lower()
        if lower.endswith((".xlsx", ".xlsm", ".xls")):
            book = pd.read_excel(io.BytesIO(content), sheet_name=None, dtype=object)
            for sheet, frame in book.items():
                frame = _clean_frame(frame)
                if not frame.empty:
                    sources.append(Source(f"{filename} › {sheet}", frame))
        elif lower.endswith((".csv", ".txt")):
            text = _decode(content)
            sep = ";" if text.count(";") > text.count(",") else ","
            frame = _clean_frame(pd.read_csv(io.StringIO(text), sep=sep, dtype=object))
            sources.append(Source(filename, frame))
        else:
            raise ValueError(f"Unsupported file type: {filename} (use .xlsx or .csv)")
    return sources


def _decode(content: bytes) -> str:
    for enc in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", "ignore")


def _clean_frame(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.dropna(how="all").dropna(axis=1, how="all")
    frame.columns = [str(c).strip() for c in frame.columns]
    return frame


# ── Mapping ───────────────────────────────────────────────────────────────────
def suggest_mapping(table: str, columns: list[str]) -> dict[str, Optional[str]]:
    norm = {c: normalize(c) for c in columns}
    used: set[str] = set()
    mapping: dict[str, Optional[str]] = {}
    # Exact synonym matches first, then "column contains synonym", for every field.
    for exact in (True, False):
        for fname, (_, synonyms) in FIELDS[table].items():
            if mapping.get(fname):
                continue
            for syn in synonyms:
                hit = next((c for c in columns if c not in used and
                            (norm[c] == syn if exact else (syn in norm[c] and len(syn) > 2))), None)
                if hit:
                    mapping[fname] = hit
                    used.add(hit)
                    break
    return {f: mapping.get(f) for f in FIELDS[table]}


def mapping_score(table: str, mapping: dict) -> float:
    required = [f for f, (req, _) in FIELDS[table].items() if req]
    found_req = sum(1 for f in required if mapping.get(f))
    found_all = sum(1 for v in mapping.values() if v)
    return found_req * 10 + found_all - (100 if found_req < len(required) else 0)


def detect_tables(sources: list[Source]) -> dict[str, Optional[int]]:
    """Assign each table to the best matching source (by sheet name hint, then columns)."""
    assignment: dict[str, Optional[int]] = {t: None for t in TABLES}
    taken: set[int] = set()
    for table in ("notices", "work_orders", "equipments", "links"):
        best, best_score = None, float("-inf")
        for i, src in enumerate(sources):
            if i in taken:
                continue
            score = mapping_score(table, suggest_mapping(table, list(src.frame.columns)))
            name = normalize(src.name.split("›")[-1])
            if any(name.startswith(h) or f" {h}" in f" {name}" for h in SHEET_HINTS[table]):
                score += 25
            if score > best_score:
                best, best_score = i, score
        if best is not None and best_score > 0:
            assignment[table] = best
            taken.add(best)
    return assignment


def preview(sources: list[Source]) -> dict:
    assignment = detect_tables(sources)
    return {
        "sources": [{"index": i, "name": s.name, "columns": list(s.frame.columns), "rows": len(s.frame),
                     "sample": _json_rows(s.frame.head(5))} for i, s in enumerate(sources)],
        "tables": {
            t: {"source": idx,
                "mapping": suggest_mapping(t, list(sources[idx].frame.columns)) if idx is not None else {f: None for f in FIELDS[t]},
                "fields": [{"name": f, "required": req} for f, (req, _) in FIELDS[t].items()]}
            for t, idx in assignment.items()
        },
    }


def _json_rows(frame: pd.DataFrame) -> list[dict]:
    rows = []
    for rec in frame.to_dict(orient="records"):
        rows.append({k: (None if _is_blank(v) else (v.isoformat() if isinstance(v, (datetime, date)) else str(v)))
                     for k, v in rec.items()})
    return rows


# ── Values ────────────────────────────────────────────────────────────────────
def _is_blank(v) -> bool:
    return v is None or (isinstance(v, float) and pd.isna(v)) or (isinstance(v, str) and not v.strip()) or v is pd.NaT


def _text(v) -> str:
    if _is_blank(v):
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def _date(v) -> Optional[date]:
    if _is_blank(v):
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    parsed = pd.to_datetime(str(v).strip(), errors="coerce", dayfirst=not str(v).strip()[:4].isdigit())
    return None if pd.isna(parsed) else parsed.date()


def _number(v) -> Optional[float]:
    if _is_blank(v):
        return None
    try:
        return float(str(v).replace(",", ".").strip())
    except ValueError:
        return None


def flux_from(*texts: str) -> Optional[str]:
    words = normalize(" ".join(t for t in texts if t)).split()
    for flux in ("ROUGE", "VERT", "JAUNE"):
        if any(w.startswith(k) for w in words for k in FLUX_WORDS[flux]):
            return flux
    return None


# ── Building ──────────────────────────────────────────────────────────────────
def build(sources: list[Source], tables: dict[str, dict]) -> ImportResult:
    """`tables[t] = {"source": index|None, "mapping": {field: column|None}}`."""
    res = ImportResult()

    def rows_of(table: str):
        spec = tables.get(table) or {}
        idx = spec.get("source")
        if idx is None:
            return None
        if not (0 <= idx < len(sources)):
            raise ValueError(f"Unknown source for {table}")
        mapping = {f: c for f, c in (spec.get("mapping") or {}).items() if c}
        missing = [f for f, (req, _) in FIELDS[table].items() if req and f not in mapping]
        if missing:
            raise ValueError(f"{table}: required columns not mapped: {', '.join(missing)}")
        frame = sources[idx].frame
        bad = [c for c in mapping.values() if c not in frame.columns]
        if bad:
            raise ValueError(f"{table}: unknown columns {', '.join(bad)}")
        return [(i + 2, {f: rec.get(c) for f, c in mapping.items()}) for i, rec in enumerate(frame.to_dict(orient="records"))]

    def issue(table, row, code, problem):
        res.issues.append({"table": table, "row": row, "code": code or None, "issue": problem})

    # Equipments
    equipments: dict[str, dict] = {}
    for row, r in rows_of("equipments") or []:
        code = _text(r.get("code"))
        if not code:
            issue("equipments", row, None, "missing_code")
            continue
        if code in equipments:
            issue("equipments", row, code, "duplicate_code")
            continue
        equipments[code] = {"code": code, "name": _text(r.get("name")), "tag": _text(r.get("tag")),
                            "subsystem": _text(r.get("subsystem")), "criticality_label": _text(r.get("criticality_label")),
                            "criticality_note": _number(r.get("criticality_note"))}
    # Also accept references by tag (e.g. notices that use "CV-101" instead of "E01").
    by_tag = {e["tag"]: code for code, e in equipments.items() if e["tag"]}

    def resolve_equipment(table, row, code, raw):
        eq = _text(raw)
        if not eq:
            issue(table, row, code, "missing_equipment")
            return None
        if eq in equipments:
            return eq
        if eq in by_tag:
            return by_tag[eq]
        equipments[eq] = {"code": eq, "name": "", "tag": "", "subsystem": "", "criticality_label": "", "criticality_note": None}
        issue(table, row, code, "unknown_equipment_created")
        return eq

    def common(table, row, r):
        code = _text(r.get("code"))
        if not code:
            issue(table, row, None, "missing_code")
            return None
        d = _date(r.get("date"))
        if d is None:
            issue(table, row, code, "missing_or_invalid_date")
            return None
        eq = resolve_equipment(table, row, code, r.get("equipment"))
        if eq is None:
            return None
        return code, d, eq

    seen: set[str] = set()
    for row, r in rows_of("notices") or []:
        base = common("notices", row, r)
        if not base:
            continue
        code, d, eq = base
        if code in seen:
            issue("notices", row, code, "duplicate_code")
            continue
        flux = flux_from(_text(r.get("flux"))) or (None if _text(r.get("flux")) else flux_from(_text(r.get("category"))))
        if flux is None:
            issue("notices", row, code, "undefined_flux")
            continue
        seen.add(code)
        ctx = _number(r.get("context_note"))
        res.notices.append({"code": code, "date": d, "equipment": eq, "flux": flux,
                            "category": _text(r.get("category")), "symptom": _text(r.get("symptom")),
                            "description": _text(r.get("description")), "status": _text(r.get("status")),
                            "postponements": int(_number(r.get("postponements")) or 0), "issuer": _text(r.get("issuer")),
                            "context_note": None if ctx is None else max(0, min(5, int(round(ctx))))})

    seen = set()
    for row, r in rows_of("work_orders") or []:
        base = common("work_orders", row, r)
        if not base:
            continue
        code, d, eq = base
        if code in seen:
            issue("work_orders", row, code, "duplicate_code")
            continue
        flux = flux_from(_text(r.get("flux"))) or (None if _text(r.get("flux")) else flux_from(_text(r.get("type"))))
        if flux is None:
            issue("work_orders", row, code, "undefined_flux")
            continue
        seen.add(code)
        res.work_orders.append({"code": code, "date": d, "equipment": eq, "flux": flux, "type": _text(r.get("type")),
                                "symptom": _text(r.get("symptom")), "cause": _text(r.get("cause")),
                                "downtime_hours": _number(r.get("downtime_hours")), "status": _text(r.get("status")),
                                "linked_notice": _text(r.get("linked_notice")) or None})

    notice_codes = {n["code"] for n in res.notices}
    wo_codes = {o["code"] for o in res.work_orders}
    for row, r in rows_of("links") or []:
        n, o = _text(r.get("notice")), _text(r.get("work_order"))
        if n not in notice_codes or o not in wo_codes:
            issue("links", row, f"{n}>{o}", "unknown_notice_or_work_order")
            continue
        res.links.append({"notice": n, "work_order": o, "expert_status": _text(r.get("expert_status"))})

    if not res.notices:
        raise ValueError("No notices could be imported: check the notices table and its mapping.")

    res.equipments = list(equipments.values())
    res.counts = {"equipments": len(res.equipments), "notices": len(res.notices), "work_orders": len(res.work_orders),
                  "links": len(res.links),
                  "flux": {f: sum(1 for n in res.notices if n["flux"] == f) + sum(1 for o in res.work_orders if o["flux"] == f)
                           for f in ("ROUGE", "VERT", "JAUNE")}}
    return res
