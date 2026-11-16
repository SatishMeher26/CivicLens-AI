"""CivicLens AI — Cryptographic Security and Token Utilities
Provides standard PBKDF2-HMAC-SHA256 password hashing with unique salt,
constant-time comparisons, cryptographically secure token generation,
and brute-force rate-limiting.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict

# 100,000 iterations PBKDF2-SHA256 (NIST recommended minimum)
HASH_ITERATIONS = 100_000


def generate_salt(length: int = 16) -> str:
    """Generates a random hex-encoded cryptographic salt."""
    return secrets.token_hex(length)


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a plaintext password with PBKDF2-HMAC-SHA256.
    Returns: (password_hash, salt)
    """
    if not salt:
        salt = generate_salt()
    
    key = hashlib.pbkdf2_hmac(
        hash_name="sha256",
        password=password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        iterations=HASH_ITERATIONS
    )
    return key.hex(), salt


def verify_password(plain_password: str, password_hash: str, salt: str) -> bool:
    """Verifies a password against the stored hash using constant-time comparison."""
    calculated_hash, _ = hash_password(plain_password, salt)
    return secrets.compare_digest(calculated_hash, password_hash)


def generate_secure_token(length: int = 32) -> str:
    """Generates a URL-safe cryptographically secure random token."""
    return secrets.token_urlsafe(length)


class LoginRateLimiter:
    """In-memory rate limiter tracking failed login attempts per identifier/IP."""

    def __init__(self, max_attempts: int = 5, lock_duration_minutes: int = 15):
        self.max_attempts = max_attempts
        self.lock_duration = timedelta(minutes=lock_duration_minutes)
        self.attempts: Dict[str, Dict[str, Any]] = {}

    def is_locked(self, identifier: str) -> Tuple[bool, int]:
        """Returns (is_locked, remaining_lock_seconds)."""
        record = self.attempts.get(identifier.lower())
        if not record:
            return False, 0
        
        lock_until = record.get("locked_until")
        if lock_until:
            now = datetime.utcnow()
            if now < lock_until:
                remaining = int((lock_until - now).total_seconds())
                return True, remaining
            else:
                # Lock expired, reset
                del self.attempts[identifier.lower()]
                return False, 0

        return False, 0

    def record_failure(self, identifier: str) -> int:
        """Records a failed attempt and locks if threshold is reached. Returns remaining attempts."""
        key = identifier.lower()
        now = datetime.utcnow()
        record = self.attempts.get(key, {"count": 0, "first_failed": now, "locked_until": None})
        record["count"] += 1
        
        if record["count"] >= self.max_attempts:
            record["locked_until"] = now + self.lock_duration
            self.attempts[key] = record
            return 0
        
        self.attempts[key] = record
        return self.max_attempts - record["count"]

    def record_success(self, identifier: str):
        """Clears failure history on successful login."""
        self.attempts.pop(identifier.lower(), None)


rate_limiter = LoginRateLimiter(max_attempts=5, lock_duration_minutes=15)
