"""Fernet encryption for API credentials stored in DB.

Backward-compatible: values with `ENC_PREFIX` are encrypted, plain values
(legacy rows) are returned as-is. New writes always encrypt.

Requires FERNET_KEY in environment (generate with
`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`).
"""
from __future__ import annotations

import logging

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

logger = logging.getLogger(__name__)

ENC_PREFIX = "enc:v1:"


def _cipher() -> Fernet | None:
    key = settings.fernet_key
    if not key:
        return None
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception as e:
        logger.error("Invalid FERNET_KEY: %s", e)
        return None


def encrypt(plain: str) -> str:
    """Encrypt a plain string. Returns prefixed ciphertext.

    If FERNET_KEY is not configured, returns the plain string unchanged
    (with a warning) so the app keeps working during key rollout.
    """
    if not plain:
        return plain
    if plain.startswith(ENC_PREFIX):
        return plain  # already encrypted
    c = _cipher()
    if c is None:
        logger.warning("FERNET_KEY not set — storing credential in plaintext")
        return plain
    token = c.encrypt(plain.encode()).decode()
    return ENC_PREFIX + token


def decrypt(stored: str) -> str:
    """Decrypt a stored credential. Plain (legacy) values pass through."""
    if not stored or not stored.startswith(ENC_PREFIX):
        return stored
    c = _cipher()
    if c is None:
        logger.error("FERNET_KEY not set — cannot decrypt credential")
        return ""
    try:
        return c.decrypt(stored[len(ENC_PREFIX):].encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt credential (InvalidToken)")
        return ""
