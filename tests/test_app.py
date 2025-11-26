import uuid
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister():
    email = f"test-{uuid.uuid4().hex}@mergington.edu"
    activity = quote("Chess Club", safe="")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify present
    data = client.get("/activities").json()
    assert email in data["Chess Club"]["participants"]

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify removed
    data = client.get("/activities").json()
    assert email not in data["Chess Club"]["participants"]


def test_signup_already_signed():
    email = f"test-{uuid.uuid4().hex}@mergington.edu"
    activity = quote("Chess Club", safe="")

    # First signup OK
    resp1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp1.status_code == 200

    # Second signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Cleanup
    client.post(f"/activities/{activity}/unregister?email={email}")


def test_unregister_not_registered():
    email = f"not-registered-{uuid.uuid4().hex}@mergington.edu"
    activity = quote("Chess Club", safe="")

    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 400
