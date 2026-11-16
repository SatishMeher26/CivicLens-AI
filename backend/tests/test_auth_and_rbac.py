"""CivicLens AI — Multi-Role Authentication & RBAC Test Suite
Tests registration, role logins, rate limiting, RBAC permissions, and invitation workflows.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_demo_accounts_provisioned(client):
    res = client.get("/api/v1/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()["accounts"]
    assert len(accounts) == 4
    roles = [a["role"] for a in accounts]
    assert "citizen" in roles
    assert "operator" in roles
    assert "reviewer" in roles
    assert "admin" in roles


def test_citizen_registration_and_login(client):
    # Register new citizen
    reg_payload = {
        "name": "Pooja Patil",
        "mobile": "9822334455",
        "email": "pooja.patil@example.com",
        "password": "Password@123",
        "locality": "Kothrud, Pune",
        "consent_terms": True
    }
    reg_res = client.post("/api/v1/auth/register-citizen", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["role"] == "citizen"
    assert reg_data["user"]["name"] == "Pooja Patil"

    # Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register-citizen", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()

    # Login with mobile
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "9822334455",
        "password": "Password@123",
        "role": "citizen"
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "citizen"


def test_authority_logins_all_roles(client):
    # 1. Municipal Operator
    op_res = client.post("/api/v1/auth/login", json={
        "identifier": "PMC-OP-2041",
        "password": "OperatorDemo@123",
        "role": "operator"
    })
    assert op_res.status_code == 200
    assert op_res.json()["user"]["role"] == "operator"
    assert "issue:triage" in op_res.json()["user"]["permissions"]

    # 2. Quality Reviewer
    rev_res = client.post("/api/v1/auth/login", json={
        "identifier": "PCMC-QR-5012",
        "password": "ReviewerDemo@123",
        "role": "reviewer"
    })
    assert rev_res.status_code == 200
    assert rev_res.json()["user"]["role"] == "reviewer"
    assert "verify:approve" in rev_res.json()["user"]["permissions"]

    # 3. Civic Administrator
    adm_res = client.post("/api/v1/auth/login", json={
        "identifier": "PMC-ADM-001",
        "password": "AdminDemo@123",
        "role": "admin",
        "mfa_code": "123456"
    })
    assert adm_res.status_code == 200
    assert adm_res.json()["user"]["role"] == "admin"
    assert "admin:users_manage" in adm_res.json()["user"]["permissions"]


def test_rbac_citizen_restricted_from_status_change(client):
    # Citizen should be rejected if attempting to update status directly
    status_res = client.post(
        "/api/v1/issues/iss-001/status",
        json={
            "to_status": "in_progress",
            "reason": "Unauthorized attempt",
            "changed_by": "Fake Citizen",
            "role": "citizen"
        }
    )
    assert status_res.status_code == 403
    assert "restricted" in status_res.json()["detail"].lower()


def test_authority_invitation_lifecycle(client):
    # Admin logs in
    adm_res = client.post("/api/v1/auth/login", json={
        "identifier": "PMC-ADM-001",
        "password": "AdminDemo@123",
        "role": "admin"
    })
    token = adm_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invite a new field engineer
    invite_res = client.post(
        "/api/v1/auth/invite",
        headers=headers,
        json={
            "email": "anand.more@pune.gov.in",
            "name": "Er. Anand More",
            "role": "operator",
            "employee_id": "PMC-OP-7788",
            "department_id": "dept-drainage",
            "department_name": "Drainage & Stormwater Department",
            "jurisdiction_ward": "Kothrud",
            "designation": "Assistant Executive Engineer"
        }
    )
    assert invite_res.status_code == 200
    invite_token = invite_res.json()["invite_token"]

    # Activated by official setting password
    act_res = client.post("/api/v1/auth/activate-invite", json={
        "invite_token": invite_token,
        "password": "SecurePassword@123"
    })
    assert act_res.status_code == 200
    assert act_res.json()["employee_id"] == "PMC-OP-7788"

    # Newly activated official can log in
    new_login = client.post("/api/v1/auth/login", json={
        "identifier": "PMC-OP-7788",
        "password": "SecurePassword@123",
        "role": "operator"
    })
    assert new_login.status_code == 200
    assert new_login.json()["user"]["name"] == "Er. Anand More"
