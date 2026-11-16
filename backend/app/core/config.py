import os
from typing import List

class Config:
    # Backend configuration
    CORS_ALLOWED_ORIGINS: List[str] = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', 'change_me_to_a_secure_secret')
    # Supabase / PostgreSQL
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY', '')
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
    DATABASE_URL: str = os.getenv('DATABASE_URL', '')

config = Config()