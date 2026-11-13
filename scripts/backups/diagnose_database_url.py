#!/usr/bin/env python3
"""Report which structural check of the backup database URL fails, without revealing it.

Reads SUPABASE_DB_URL and SUPABASE_PROJECT_REF from the environment and prints one
"NAME: PASS" or "NAME: FAIL" line per check. It makes no network connection and never prints
the value, any part of it, or an exception. Exit status is 1 when any check fails.
"""
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))


def main():
    try:
        from export_storage import DATABASE_URL_CHECKS, diagnose_database_url
        result = diagnose_database_url(os.environ.get("SUPABASE_DB_URL"), os.environ.get("SUPABASE_PROJECT_REF", ""))
        failed = [name for name in DATABASE_URL_CHECKS if result.get(name) is not True]
    except BaseException:  # never let a traceback carry the value into the log
        print("DIAGNOSIS: FAIL")
        return 1
    for name in DATABASE_URL_CHECKS:
        print(f"{name}: {'FAIL' if name in failed else 'PASS'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
