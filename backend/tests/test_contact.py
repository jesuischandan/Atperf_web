import api.contact as contact


def test_contact_topic_leads_subject_and_stays_single_line(client, monkeypatch):
    sent = {}
    monkeypatch.setattr(contact, "send_contact_email", lambda **kw: sent.update(kw) or True)
    monkeypatch.setattr(contact.openai_client, "api_key", None)
    res = client.post("/api/contact", json={"name": "Ann", "email": "ann@example.com", "message": "Bonjour",
                                            "topic": "STRAP Maintenance\r\nBcc: spam@example.com"})
    assert res.status_code == 200, res.text
    assert sent["subject"].startswith("[STRAP Maintenance Bcc: spam@example.com] ")
    assert "\n" not in sent["subject"] and "\r" not in sent["subject"]
    assert sent["topic"] == "STRAP Maintenance Bcc: spam@example.com"


def test_contact_without_topic(client, monkeypatch):
    sent = {}
    monkeypatch.setattr(contact, "send_contact_email", lambda **kw: sent.update(kw) or True)
    monkeypatch.setattr(contact.openai_client, "api_key", None)
    assert client.post("/api/contact", json={"name": "Ann", "email": "a@b.c", "message": "Hi"}).status_code == 200
    assert sent["subject"] == "Contact Form Submission from Ann" and sent["topic"] == ""
