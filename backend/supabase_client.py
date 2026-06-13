"""
Railway Guardian AI — Supabase Client
Singleton client for database and storage operations.
"""

from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"❌ Supabase initialization failed: {e}")
else:
    print("⚠️  Supabase client not initialized — missing credentials")
