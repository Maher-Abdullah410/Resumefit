from io import BytesIO
from types import SimpleNamespace
from urllib.error import HTTPError

import pytest

from app.core.errors import AppError
from app.services import gemini


@pytest.mark.parametrize(
    ("status_code", "error_code"),
    [
        (400, "GEMINI_BAD_REQUEST"),
        (401, "GEMINI_AUTH_ERROR"),
        (403, "GEMINI_AUTH_ERROR"),
        (404, "GEMINI_MODEL_NOT_FOUND"),
        (429, "GEMINI_QUOTA_EXCEEDED"),
        (503, "GEMINI_SERVICE_ERROR"),
    ],
)
def test_gemini_http_errors_are_actionable(monkeypatch, status_code, error_code):
    monkeypatch.setattr(
        gemini,
        "get_settings",
        lambda: SimpleNamespace(
            gemini_api_key="test-key",
            gemini_model="gemini-3.8-flash",
        ),
    )
    def reject_request(request, timeout):
        assert timeout == gemini.REQUEST_TIMEOUT_SECONDS
        raise HTTPError(
            request.full_url,
            status_code,
            "Gemini request failed",
            hdrs=None,
            fp=BytesIO(b'{"error":{"message":"provider response"}}'),
        )

    monkeypatch.setattr(gemini, "urlopen", reject_request)

    with pytest.raises(AppError) as raised:
        gemini._request_gemini("test prompt")

    assert raised.value.status_code == 502
    assert raised.value.code == error_code
    assert raised.value.details == [{"provider_status": status_code}]


def test_gemini_connection_errors_have_a_clear_message(monkeypatch):
    monkeypatch.setattr(
        gemini,
        "get_settings",
        lambda: SimpleNamespace(gemini_api_key="test-key", gemini_model="gemini-3.8-flash"),
    )
    def fail_request(request, timeout):
        assert request is not None
        assert timeout == gemini.REQUEST_TIMEOUT_SECONDS
        raise OSError("offline")

    monkeypatch.setattr(gemini, "urlopen", fail_request)

    with pytest.raises(AppError) as raised:
        gemini._request_gemini("test prompt")

    assert raised.value.code == "GEMINI_CONNECTION_ERROR"
    assert "network access" in raised.value.message
