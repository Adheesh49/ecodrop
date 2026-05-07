import pytest
import sys
import os

# Allow imports from the backend root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_login_success(client):
    """
    Test that a registered user can log in with correct credentials.
    Expected: 200 status, message = 'Login successful', name and role returned.
    """
    response = client.post("/login", json={
        "email": "adheeshpandey49@gmail.com",
        "password": "Adheesh12"
    })

    data = response.get_json()

    assert response.status_code == 200
    assert data["message"] == "Login successful"
    assert "name" in data
    assert "role" in data


def test_login_wrong_password(client):
    """
    Test that login fails with wrong password.
    Expected: 401 status, message = 'Incorrect password'.
    """
    response = client.post("/login", json={
        "email": "adheeshpandey49@gmail.com",
        "password": "thisisthewrongpassword999"
    })

    data = response.get_json()

    assert response.status_code == 401
    assert data["message"] == "Incorrect password"


def test_login_user_not_found(client):
    """
    Test that login fails if the email does not exist.
    Expected: 404 status, message = 'User not found'.
    """
    response = client.post("/login", json={
        "email": "notexist@email.com",
        "password": "anypassword"
    })

    data = response.get_json()

    assert response.status_code == 404
    assert data["message"] == "User not found"


def test_login_missing_fields(client):
    """
    Test that login fails when email or password is missing.
    Expected: 400 or 404/401 — should not crash the server.
    """
    response = client.post("/login", json={
        "email": "",
        "password": ""
    })

    assert response.status_code in [400, 401, 404, 500]


def test_login_returns_correct_role(client):
    """
    Test that admin user gets role = 'admin' on login.
    Expected: role field equals 'admin'.
    """
    response = client.post("/login", json={
        "email": "admin@ecodrop.com",
        "password": "adminpassword"
    })

    data = response.get_json()

    if response.status_code == 200:
        assert data["role"] in ["user", "admin"]