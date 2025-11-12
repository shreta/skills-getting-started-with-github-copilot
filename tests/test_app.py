import uuid
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic sanity check
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    # create a unique test email so tests are repeatable
    email = f"test+{uuid.uuid4().hex}@example.com"

    # Sign up
    res = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # Verify the participant appears
    res2 = client.get("/activities")
    assert res2.status_code == 200
    participants = res2.json()[activity]["participants"]
    assert email in participants

    # Unregister
    res3 = client.delete(f"/activities/{quote(activity)}/participants", params={"email": email})
    assert res3.status_code == 200

    # Verify removal
    res4 = client.get("/activities")
    assert email not in res4.json()[activity]["participants"]
