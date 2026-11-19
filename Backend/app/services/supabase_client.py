"""
TruthLens Supabase Integration
Provides asynchronous and synchronous client access to Supabase database & storage.
"""

import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("truthlens.supabase")

_supabase_client = None


def get_supabase_client():
    """Initializes and returns a singleton Supabase client instance."""
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
        logger.warning(
            "Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY in .env"
        )
        return None

    try:
        from supabase import create_client, Client

        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except ImportError:
        logger.error("supabase Python library is not installed.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
