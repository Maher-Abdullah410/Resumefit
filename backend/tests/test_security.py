import time
import uuid

import jwt
import pytest

from app.core import security
from app.core.config import Settings, get_settings


def test_hash_is_bcrypt_and_not_plaintext():
    h = security.hash_password("S3cure!Pass42")
    assert h != "S3cure!Pass42"
    assert h.startswith("$2b$")
    assert security.verify_password("S3cure!Pass42", h)
    assert not security.verify_password("wrong-pass1", h)


def test_hashes_are_salted():
    assert security.hash_password("S3cure!Pass42") != security.hash_password("S3cure!Pass42")


def test_default_bcrypt_cost_is_12():
    assert Settings.model_fields["bcrypt_rounds"].default == 12


def test_verify_handles_garbage_hash():
    assert security.verify_password("x", "not-a-hash") is False


def test_jwt_roundtrip_and_claims():
    uid = uuid.uuid4()
    token, expires_in = security.create_access_token(uid)
    assert expires_in == 3600
    assert security.decode_access_token(token) == uid
    payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
    assert payload["type"] == "access" and payload["exp"] - payload["iat"] == 3600


def test_jwt_rejects_tampering_wrong_secret_and_expiry():
    uid = uuid.uuid4()
    token, _ = security.create_access_token(uid)
    with pytest.raises(security.TokenError):
        security.decode_access_token(token[:-2] + ("AA" if token[-2:] != "AA" else "BB"))
    forged = jwt.encode({"sub": str(uid), "type": "access", "exp": int(time.time()) + 60}, "x" * 40, algorithm="HS256")
    with pytest.raises(security.TokenError):
        security.decode_access_token(forged)
    expired = jwt.encode({"sub": str(uid), "type": "access", "exp": int(time.time()) - 5},
                         get_settings().jwt_secret, algorithm="HS256")
    with pytest.raises(security.TokenError):
        security.decode_access_token(expired)


def test_jwt_rejects_alg_none_and_wrong_type():
    uid = str(uuid.uuid4())
    none_token = jwt.encode({"sub": uid, "type": "access", "exp": int(time.time()) + 60}, None, algorithm="none")
    with pytest.raises(security.TokenError):
        security.decode_access_token(none_token)
    refresh_like = jwt.encode({"sub": uid, "type": "refresh", "exp": int(time.time()) + 60},
                              get_settings().jwt_secret, algorithm="HS256")
    with pytest.raises(security.TokenError):
        security.decode_access_token(refresh_like)


def test_weak_secret_is_rejected():
    with pytest.raises(Exception):
        Settings(jwt_secret="short")
