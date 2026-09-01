"""
Supabase Client Initializer for Backend Services.
Provides a singleton Supabase client using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None

def get_supabase_client():
    """
    Returns an initialized Supabase Python client.
    Uses SUPABASE_SERVICE_ROLE_KEY if available for full server-side access,
    or falls back to SUPABASE_ANON_KEY.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL:
        logger.warning("SUPABASE_URL is not set. Supabase client is uninitialized.")
        return None

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not key:
        logger.warning("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
