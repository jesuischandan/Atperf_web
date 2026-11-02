"""STRAP Maintenance: access rules, import, engine scenarios T01–T10 from the fictive workbook."""
import io
from datetime import timedelta

import pytest

import models
from maintenance import engine as E
from maintenance import importer
from api.strap_maintenance import SAMPLE_FILE
from tests.conftest import login_staff, login_user

API = "/api/maintenance"


@pytest.fixture
def sample_engine():
    sources = importer.read_sources([(SAMPLE_FILE.name, SAMPLE_FILE.read_bytes())])
    pv = importer.preview(sources)
    res = importer.build(sources, {t: {"source": v["source"], "mapping": v["mapping"]} for t, v in pv["tables"].items()})
    return E.Engine([E.Equipment(**e) for e in res.equipments], [E.Notice(**n) for n in res.notices],
                    [E.WorkOrder(**o) for o in res.work_orders], E.Config()), res


@pytest.fixture
def pilot(db, make_user):
    def _make(email="pilot@client.com", company="acme", enabled=True):
        if not db.query(models.GCPCompany).filter_by(company_id=company).first():
            db.add(models.GCPCompany(company_id=company, company_name=company.title()))
            db.commit()
        db.query(models.GCPCompany).filter_by(company_id=company).update({"maintenance_pilot": 1 if enabled else 0})
        db.commit()
        user = make_user(email=email)
        user.company_id = company
        db.commit()
        return user
    return _make


def staff_with_sample(client, make_staff, company_id=None):
    make_staff()
    login_staff(client)
    res = client.post(f"{API}/datasets/sample", json={"company_id": company_id})
    assert res.status_code == 201, res.text
    return res.json()["id"]


# ── Import ────────────────────────────────────────────────────────────────────
def test_sample_workbook_is_detected_and_imported_cleanly(sample_engine):
    eng, res = sample_engine
    assert res.counts["equipments"] == 12 and res.counts["notices"] == 102 and res.counts["work_orders"] == 48
    assert res.counts["links"] == 32 and res.issues == []
    assert len(eng.yellows) == 84 and len(eng.reds) == 36


def test_csv_import_with_auto_mapping_and_validation_report(client, make_staff):
    make_staff()
    login_staff(client)
    notices = ("Numéro avis;Date de création;Poste technique;Couleur;Texte court;Statut\n"
               "N1;12/01/2025;P-1;Jaune;Fuite d'huile;Ouvert\n"
               "N2;;P-1;Jaune;Vibration;Ouvert\n"          # missing date → skipped
               "N3;15/02/2025;P-9;Bleu;Bruit;Ouvert\n")     # unknown flux → skipped
    orders = "Ordre;Date début;Poste technique;Type;Symptôme;Cause\nO1;20/01/2025;P-1;Correctif urgent;Perte de pression;Joint usé\n"
    res = client.post(f"{API}/import/preview", files=[("files", ("avis.csv", notices.encode(), "text/csv")),
                                                      ("files", ("ot.csv", orders.encode(), "text/csv"))])
    assert res.status_code == 200, res.text
    pv = res.json()
    assert pv["tables"]["notices"]["mapping"]["code"] == "Numéro avis"
    assert pv["tables"]["work_orders"]["mapping"]["date"] == "Date début"
    tables = {t: {"source": v["source"], "mapping": v["mapping"]} for t, v in pv["tables"].items()}
    res = client.post(f"{API}/import/commit", json={"token": pv["token"], "name": "Site test", "tables": tables})
    assert res.status_code == 201, res.text
    report = res.json()["report"]
    assert report["counts"]["notices"] == 1 and report["counts"]["work_orders"] == 1
    issues = {(i["code"], i["issue"]) for i in report["issues"]}
    assert ("N2", "missing_or_invalid_date") in issues and ("N3", "undefined_flux") in issues
    assert ("N1", "unknown_equipment_created") in issues
    # The work order's flux is derived from its type when there is no flux column.
    detail = client.get(f"{API}/datasets/{res.json()['id']}/replay/O1")
    assert detail.status_code == 200 and detail.json()["precursors"][0]["notice"] == "N1"


def test_import_rejects_unmapped_required_columns(client, make_staff):
    make_staff()
    login_staff(client)
    pv = client.post(f"{API}/import/preview", files=[("files", ("a.csv", b"Foo;Bar\n1;2\n", "text/csv"))]).json()
    tables = {"notices": {"source": 0, "mapping": {"code": "Foo"}}}
    res = client.post(f"{API}/import/commit", json={"token": pv["token"], "name": "x", "tables": tables})
    assert res.status_code == 400 and "required" in res.json()["detail"]


def test_import_rejects_other_file_types(client, make_staff):
    make_staff()
    login_staff(client)
    res = client.post(f"{API}/import/preview", files=[("files", ("x.html", b"<html>", "text/html"))])
    assert res.status_code == 400


# ── Access ────────────────────────────────────────────────────────────────────
def test_access_rules(client, make_user, make_staff, pilot, db):
    assert client.get(f"{API}/datasets").status_code == 401
    make_user(email="plain@client.com")
    login_user(client, "plain@client.com")
    assert client.get(f"{API}/datasets").status_code == 403         # company not a pilot
    client.cookies.clear()

    staff_with_sample(client, make_staff, company_id=None)            # internal dataset
    db.query(models.GCPCompany).filter_by(company_id="acme").update({"maintenance_pilot": 1})
    db.commit()
    ds_acme = client.post(f"{API}/datasets/sample", json={"company_id": "acme"}).json()["id"]
    internal = client.get(f"{API}/datasets").json()
    assert len(internal) == 2                                         # staff sees everything
    client.cookies.clear()

    pilot(email="pilot@client.com", company="acme")
    login_user(client, "pilot@client.com")
    listed = client.get(f"{API}/datasets").json()
    assert [d["id"] for d in listed] == [ds_acme]                     # own company only
    other = next(d["id"] for d in internal if d["id"] != ds_acme)
    assert client.get(f"{API}/datasets/{other}").status_code == 404
    assert client.get(f"{API}/datasets/{ds_acme}/notices").status_code == 200


def test_pilot_flag_is_staff_only_and_returned_at_login(client, db, make_user, make_staff):
    db.add(models.GCPCompany(company_id="acme", company_name="Acme"))
    db.commit()
    make_user(email="admin@client.com", role="admin")
    login_user(client, "admin@client.com")
    assert client.patch("/companies/acme", json={"maintenance_pilot": 1}).status_code == 403
    client.cookies.clear()
    make_staff(role="admin")
    login_staff(client)
    assert client.patch("/companies/acme", json={"maintenance_pilot": 1}).json()["maintenance_pilot"] == 1
    client.cookies.clear()
    assert login_user(client, "admin@client.com").json()["maintenance_pilot"] == 1


# ── Scenarios T01–T10 ─────────────────────────────────────────────────────────
def test_T01_yellow_before_red_same_asset_is_a_candidate(sample_engine):
    eng, _ = sample_engine
    cands = eng.candidate_links(eng.wo_by_code["OT-5001"])
    hit = next(c for c in cands if c["notice"] == "AV-1001")
    assert hit["lead_days"] == 8 and hit["same_equipment"] and hit["confidence"] == "strong"


def test_T02_alerts_without_breakdown_are_measured(sample_engine):
    eng, _ = sample_engine
    bt = eng.backtest(threshold=60)
    assert bt["alerts"] > 0 and bt["false_alerts"] == len(bt["false_alert_list"])
    assert 0 <= bt["false_alert_rate"] <= 1


def test_T03_breakdowns_without_precursor_are_counted(sample_engine):
    eng, _ = sample_engine
    bt = eng.backtest()
    assert bt["no_precursor"] >= 1
    assert bt["covered"] + sum(1 for r in bt["per_red"] if not r["covered"]) == bt["reds"]


def test_T04_preventive_notices_are_never_scored(sample_engine):
    eng, _ = sample_engine
    scored = {s.notice.code for s in eng.score_all(eng.study_date())}
    assert not any(f"AV-{i}" in scored for i in range(1085, 1103))
    assert len(scored) == 84


def test_T05_wrong_match_can_be_rejected_by_expert(client, make_staff):
    ds = staff_with_sample(client, make_staff)
    detail = client.get(f"{API}/datasets/{ds}/notices/AV-1025").json()
    imported = next(l for l in detail["links"] if l["work_order"] == "OT-5001")
    assert imported["imported_status"] == "Rejeté fictivement"
    res = client.post(f"{API}/datasets/{ds}/decisions", json={"target_type": "link", "target": "AV-1025>OT-5001",
                                                             "decision": "rejected", "comment": "Coïncidence"})
    assert res.status_code == 201
    detail = client.get(f"{API}/datasets/{ds}/notices/AV-1025").json()
    assert next(l for l in detail["links"] if l["work_order"] == "OT-5001")["decision"]["decision"] == "rejected"


def test_T06_weights_must_total_100_and_rescore_immediately(client, make_staff):
    ds = staff_with_sample(client, make_staff)
    before = {n["code"]: n["score"] for n in client.get(f"{API}/datasets/{ds}/notices").json()["notices"]}
    bad = {"weights": {**E.DEFAULT_WEIGHTS, "criticality": 30}, "thresholds": E.DEFAULT_THRESHOLDS}
    assert client.put(f"{API}/datasets/{ds}/config", json=bad).status_code == 400
    good = {"weights": {**E.DEFAULT_WEIGHTS, "criticality": 35, "context": 0}, "thresholds": E.DEFAULT_THRESHOLDS}
    assert client.put(f"{API}/datasets/{ds}/config", json=good).status_code == 200
    after = {n["code"]: n["score"] for n in client.get(f"{API}/datasets/{ds}/notices").json()["notices"]}
    assert after != before
    log = client.get(f"{API}/datasets/{ds}/decisions").json()
    assert log[0]["target_type"] == "config" and log[0]["changes"]["after"]["weights"]["criticality"] == 35


def test_T07_cockpit_ranks_by_score_with_explanations(client, make_staff):
    ds = staff_with_sample(client, make_staff)
    rows = client.get(f"{API}/datasets/{ds}/notices").json()["notices"]
    assert [r["score"] for r in rows] == sorted((r["score"] for r in rows), reverse=True)
    detail = client.get(f"{API}/datasets/{ds}/notices/{rows[0]['code']}").json()
    assert set(detail["evidence"]) == set(E.CRITERIA)
    assert all("reason" in ev for ev in detail["evidence"].values())


def test_T08_no_future_data_leaks_into_a_past_score(sample_engine):
    eng, res = sample_engine
    T = eng.wo_by_code["OT-5020"].date - timedelta(days=1)
    full = {s.notice.code: (s.score, s.notes) for s in eng.score_all(T)}
    past_only = E.Engine([E.Equipment(**e) for e in res.equipments],
                         [E.Notice(**n) for n in res.notices if n["date"] <= T],
                         [E.WorkOrder(**o) for o in res.work_orders if o["date"] < T], E.Config())
    truncated = {s.notice.code: (s.score, s.notes) for s in past_only.score_all(T)}
    assert full == truncated


def test_T09_expert_note_correction_rescores_and_is_bounded(client, make_staff):
    ds = staff_with_sample(client, make_staff)
    base = client.get(f"{API}/datasets/{ds}/notices/AV-1002").json()
    res = client.put(f"{API}/datasets/{ds}/notices/AV-1002/notes",
                     json={"overrides": {"similarity": 5}, "context_note": 5, "comment": "Vu sur le terrain"})
    assert res.status_code == 200 and res.json()["score"] > base["score"]
    detail = client.get(f"{API}/datasets/{ds}/notices/AV-1002").json()
    assert detail["evidence"]["similarity"]["overridden"] and detail["notes"]["context"] == 5
    assert detail["history"][0]["decision"] == "corrected"
    assert client.put(f"{API}/datasets/{ds}/notices/AV-1002/notes", json={"overrides": {"age": 6}}).status_code == 400
    assert client.put(f"{API}/datasets/{ds}/notices/AV-1002/notes", json={"context_note": 9}).status_code == 422


def test_T10_validation_never_creates_work_orders(client, make_staff, db):
    ds = staff_with_sample(client, make_staff)
    count = db.query(models.MaintWorkOrder).filter_by(dataset_id=ds).count()
    res = client.post(f"{API}/datasets/{ds}/decisions", json={"target_type": "notice", "target": "AV-1002", "decision": "validated"})
    assert res.status_code == 201 and res.json()["score_snapshot"] is not None
    assert db.query(models.MaintWorkOrder).filter_by(dataset_id=ds).count() == count


# ── Misc ──────────────────────────────────────────────────────────────────────
def test_replay_backtest_and_export(client, make_staff):
    ds = staff_with_sample(client, make_staff)
    r = client.get(f"{API}/datasets/{ds}/replay/OT-5002").json()
    assert r["work_order"]["code"] == "OT-5002" and r["verdict"] in ("flagged", "below_threshold", "no_precursor")
    bt = client.get(f"{API}/datasets/{ds}/backtest", params={"threshold": 60, "horizon": 90}).json()
    assert bt["reds"] == 36
    res = client.get(f"{API}/datasets/{ds}/export.xlsx")
    assert res.status_code == 200 and res.headers["content-type"].startswith("application/vnd.openxml")


def test_dataset_deletion_rules(client, make_staff, pilot):
    ds = staff_with_sample(client, make_staff, company_id=None)
    client.cookies.clear()
    pilot()
    login_user(client, "pilot@client.com")
    own = client.post(f"{API}/datasets/sample", json={}).json()["id"]
    assert client.delete(f"{API}/datasets/{ds}").status_code == 404   # not visible
    assert client.delete(f"{API}/datasets/{own}").status_code == 204
