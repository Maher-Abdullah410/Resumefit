import uuid

import pytest

from app.core.errors import AppError
from app.models.analysis import ResumeAnalysis
from tests.conftest import login, register


@pytest.fixture(autouse=True)
def mock_gemini_suggestions(monkeypatch):
    monkeypatch.setattr(
        "app.api.v1.analyses.generate_resume_suggestions",
        lambda resume_text, job_description: ["Add a measurable result to your experience."],
    )


RESUME = (
    "Software engineer with 5 years of experience building Python and React applications. "
    "Used PostgreSQL, Docker, and AWS to deliver reliable APIs. Led agile teams and improved "
    "testing automation for customer products."
)
JOB = (
    "We need a software engineer with Python, React, PostgreSQL, and Docker experience. "
    "The role will use AWS, agile project management, testing, communication, and collaboration."
)


def _token(client, email="maher@example.com"):
    register(client, email=email)
    return login(client, email=email).json()["access_token"]


def test_analysis_calculates_and_persists_result(client, db):
    token = _token(client)
    response = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {token}"},
        json={"resume_text": RESUME, "job_description": JOB},
    )

    assert response.status_code == 201
    result = response.json()
    assert 0 < result["ats_score"] < 100
    assert {"python", "react", "postgresql", "docker", "aws"} <= set(result["matched_skills"])
    assert {"communication", "project management"} <= set(result["missing_skills"])
    assert result["suggestions"] == ["Add a measurable result to your experience."]
    assert "resume_text" not in result and "job_description" not in result
    saved = db.get(ResumeAnalysis, uuid.UUID(result["id"]))
    assert saved.resume_text == RESUME and saved.job_description == JOB
    assert saved.suggestions == result["suggestions"]
    history = client.get("/api/v1/analyses", headers={"Authorization": f"Bearer {token}"})
    assert history.status_code == 200 and history.json()[0]["id"] == result["id"]


def test_analysis_reports_missing_skills_and_keywords(client):
    token = _token(client)
    response = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_text": "Experienced engineer delivering software products and collaborating across teams. " * 2,
            "job_description": JOB,
        },
    )

    assert response.status_code == 201
    result = response.json()
    assert result["ats_score"] < 100
    assert "python" in result["missing_skills"]
    assert result["missing_keywords"]


def test_analysis_requires_authentication_and_valid_input(client):
    payload = {"resume_text": RESUME, "job_description": JOB}
    assert client.post("/api/v1/analyses", json=payload).status_code == 401
    token = _token(client)
    response = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {token}"},
        json={"resume_text": "too short", "job_description": JOB},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    response = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {token}"},
        json={"resume_text": " " * 120, "job_description": JOB},
    )
    assert response.status_code == 422


def test_analysis_history_is_scoped_to_authenticated_user(client):
    first_token = _token(client)
    client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {first_token}"},
        json={"resume_text": RESUME, "job_description": JOB},
    )
    second_token = _token(client, "other@example.com")

    history = client.get(
        "/api/v1/analyses", headers={"Authorization": f"Bearer {second_token}"}
    )
    assert history.status_code == 200 and history.json() == []


def test_analysis_detail_and_delete_are_scoped_to_authenticated_user(client):
    first_token = _token(client)
    created = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {first_token}"},
        json={
            "job_title": "Platform Engineer",
            "custom_keywords": ["Terraform"],
            "resume_text": RESUME,
            "job_description": JOB,
        },
    )
    assert created.status_code == 201
    result = created.json()
    assert result["job_title"] == "Platform Engineer"
    assert result["custom_keywords"] == ["Terraform"]
    assert "terraform" in result["missing_keywords"]

    detail = client.get(
        f"/api/v1/analyses/{result['id']}",
        headers={"Authorization": f"Bearer {first_token}"},
    )
    assert detail.status_code == 200
    assert detail.json()["resume_text"] == RESUME
    assert detail.json()["job_description"] == JOB

    second_token = _token(client, "other@example.com")
    other_headers = {"Authorization": f"Bearer {second_token}"}
    assert client.get(f"/api/v1/analyses/{result['id']}", headers=other_headers).status_code == 404
    assert client.delete(f"/api/v1/analyses/{result['id']}", headers=other_headers).status_code == 404

    deleted = client.delete(
        f"/api/v1/analyses/{result['id']}",
        headers={"Authorization": f"Bearer {first_token}"},
    )
    assert deleted.status_code == 204
    assert client.get(
        f"/api/v1/analyses/{result['id']}",
        headers={"Authorization": f"Bearer {first_token}"},
    ).status_code == 404


def test_analysis_is_saved_when_gemini_suggestions_are_unavailable(client, monkeypatch):
    token = _token(client)

    def fail_suggestions(resume_text, job_description):
        raise AppError(
            502,
            "GEMINI_QUOTA_EXCEEDED",
            "Gemini's request limit or quota was reached. Check the Gemini quota and retry.",
        )

    monkeypatch.setattr(
        "app.api.v1.analyses.generate_resume_suggestions", fail_suggestions
    )
    response = client.post(
        "/api/v1/analyses",
        headers={"Authorization": f"Bearer {token}"},
        json={"resume_text": RESUME, "job_description": JOB},
    )

    assert response.status_code == 201
    result = response.json()
    assert 0 <= result["ats_score"] <= 100
    assert result["suggestions"] == []
    assert "quota" in result["suggestions_error"].lower()


def test_pdf_extraction_rejects_invalid_and_oversized_uploads(client):
    token = _token(client)
    headers = {"Authorization": f"Bearer {token}"}

    invalid = client.post(
        "/api/v1/analyses/extract",
        headers=headers,
        files={"file": ("resume.pdf", b"not a PDF", "application/pdf")},
    )
    assert invalid.status_code == 400
    assert invalid.json()["error"]["code"] == "INVALID_PDF"

    oversized = client.post(
        "/api/v1/analyses/extract",
        headers=headers,
        files={"file": ("resume.pdf", b"%PDF-" + b"x" * (5 * 1024 * 1024), "application/pdf")},
    )
    assert oversized.status_code == 413
    assert oversized.json()["error"]["code"] == "PDF_TOO_LARGE"
