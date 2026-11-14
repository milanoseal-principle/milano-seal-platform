#!/usr/bin/env python3
"""Isolated restore drill helpers. Prints counts, booleans and hashes only, never row data,
object names or credentials.

Subcommands
  expected <out.json> <schema.sql> <data.sql> [<auth-storage.sql>]
      Expected table list and per-table row counts, read from the dump files themselves.
  count-sql <expected.json> <out.sql>
      SQL that counts the restored rows of every expected table (run against the isolated target).
  compare <expected.json> <restored.tsv> <summary.json>
      Fails unless every expected table exists in the target with exactly the dumped row count.
  classify <step> <stderr_file>
      Prints one sanitized failure code for a failed step. Database diagnostics can quote restored
      values (e.g. "Failing row contains (...)"), so the captured text itself is never printed.
  storage <backup_root> <api_url>
      Recreates the private buckets, uploads every manifest object into the isolated Storage API and downloads it again; fails
      unless every served object matches the manifest's size and SHA-256. Reads the service key
      from RESTORE_TARGET_SERVICE_KEY (the isolated target's own local key).
"""
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

COPY_HEADER = re.compile(r'^COPY\s+((?:"[^"]+"|\w+)\.(?:"[^"]+"|\w+))\s*(?:\([^)]*\))?\s+FROM\s+stdin;\s*$', re.I)
CREATE_TABLE = re.compile(r'^CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|\w+)\.(?:"[^"]+"|\w+))\s*\(', re.I)


def _name(qualified):
    schema, table = re.findall(r'"([^"]+)"|(\w+)', qualified)[0:2]
    return ".".join(a or b for a, b in (schema, table))


def copy_counts(path):
    """Rows per table in a plain-text dump's COPY blocks (COPY text format is one row per line)."""
    counts, current = {}, None
    with open(path, encoding="utf-8", errors="strict") as fh:
        for line in fh:
            if current is None:
                match = COPY_HEADER.match(line.rstrip("\n"))
                if match:
                    current = _name(match.group(1))
                    counts[current] = counts.get(current, 0)
            elif line.rstrip("\n") == "\\.":
                current = None
            else:
                counts[current] += 1
    if current is not None:
        raise SystemExit("Unterminated COPY block in dump")
    return counts


def created_tables(path):
    tables = set()
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            match = CREATE_TABLE.match(line)
            if match:
                tables.add(_name(match.group(1)))
    return tables


def expected(out, schema_sql, data_sql, auth_storage_sql=None):
    tables = sorted(t for t in created_tables(schema_sql) if t.startswith("public."))
    rows = copy_counts(data_sql)
    if auth_storage_sql:
        rows.update(copy_counts(auth_storage_sql))
    if not tables:
        raise SystemExit("Schema dump declares no public tables")
    Path(out).write_text(json.dumps({"public_tables": tables, "rows": rows}, indent=1, sort_keys=True))
    print(json.dumps({"public_tables": len(tables), "tables_with_rows_in_dump": len(rows),
                      "rows_in_dump": sum(rows.values())}))


def _ident(qualified):
    schema, table = qualified.split(".", 1)
    return '"%s"."%s"' % (schema.replace('"', '""'), table.replace('"', '""'))


def count_sql(expected_json, out):
    spec = json.loads(Path(expected_json).read_text())
    names = sorted(set(spec["public_tables"]) | set(spec["rows"]))
    parts = ["select %s, (select count(*) from %s)" % ("'" + n.replace("'", "''") + "'", _ident(n)) for n in names]
    # One statement; a missing table fails the whole query, which the drill treats as a failure.
    Path(out).write_text("\nunion all\n".join(parts) + ";\n")


def compare(expected_json, restored_tsv, summary_json):
    spec = json.loads(Path(expected_json).read_text())
    restored = {}
    for line in Path(restored_tsv).read_text().splitlines():
        if line.strip():
            name, value = line.split("\t")
            restored[name] = int(value)
    missing = sorted(t for t in spec["public_tables"] if t not in restored)
    mismatched = sorted(t for t, n in spec["rows"].items() if restored.get(t) != n)
    summary = {
        "public_tables_expected": len(spec["public_tables"]),
        "public_tables_restored": len([t for t in spec["public_tables"] if t in restored]),
        "tables_with_rows_compared": len(spec["rows"]),
        "rows_expected": sum(spec["rows"].values()),
        "rows_restored": sum(restored.get(t, 0) for t in spec["rows"]),
        "missing_tables": len(missing),
        "row_count_mismatches": len(mismatched),
        "mismatched_tables": mismatched,  # table names only, never values
    }
    Path(summary_json).write_text(json.dumps(summary, indent=1, sort_keys=True))
    print(json.dumps(summary, sort_keys=True))
    if missing or mismatched:
        raise SystemExit("RESTORE_FIDELITY_FAILED")


FAILURE_CLASSES = (
    ("UNIQUE_VIOLATION", re.compile(r"duplicate key value|unique constraint", re.I)),
    ("CHECK_OR_NOT_NULL_VIOLATION", re.compile(r"violates (check|not-null) constraint", re.I)),
    ("FOREIGN_KEY_VIOLATION", re.compile(r"violates foreign key constraint", re.I)),
    ("TRIGGER_REJECTED_ROW", re.compile(r"raise|trigger|function .* line \d", re.I)),
    ("MISSING_OBJECT", re.compile(r"does not exist", re.I)),
    ("ALREADY_EXISTS", re.compile(r"already exists", re.I)),
    ("PERMISSION_DENIED", re.compile(r"permission denied|must be (owner|superuser)", re.I)),
    ("TYPE_OR_FORMAT_MISMATCH", re.compile(r"invalid input syntax|invalid byte sequence|extra data after last|missing data for column", re.I)),
    ("CONNECTION_FAILED", re.compile(r"could not connect|connection to server|server closed the connection", re.I)),
)


def classify_text(text):
    for code, pattern in FAILURE_CLASSES:
        if pattern.search(text):
            return code
    return "UNCLASSIFIED"


def classify(step, stderr_file):
    try:
        text = Path(stderr_file).read_text(errors="replace")
    except OSError:
        text = ""
    # Only the step name and a fixed code are printed; the diagnostics stay in the protected
    # temporary directory, which the workflow deletes in its always() cleanup step.
    print("::error::RESTORE_STEP_FAILED step=%s class=%s" % (re.sub(r"[^a-z0-9_-]", "", step.lower()), classify_text(text)))


def _object_url(api_url, bucket, name):
    quoted = "/".join(urllib.parse.quote(part, safe="") for part in name.split("/"))
    return "%s/storage/v1/object/%s/%s" % (api_url.rstrip("/"), urllib.parse.quote(bucket, safe=""), quoted)


def storage(root, api_url):
    key = os.environ.get("RESTORE_TARGET_SERVICE_KEY", "")
    host = urllib.parse.urlparse(api_url).hostname
    if not key or host not in ("127.0.0.1", "localhost"):
        raise SystemExit("Storage restore only targets the local isolated stack")
    root = Path(root)
    manifest = json.loads((root / "storage" / "manifest.json").read_text())
    headers = {"Authorization": "Bearer " + key, "apikey": key}
    # Buckets are recreated private, as they are in production.
    for bucket in sorted(manifest["counts"]):
        req = urllib.request.Request("%s/storage/v1/bucket" % api_url.rstrip("/"), method="POST",
                                     data=json.dumps({"id": bucket, "name": bucket, "public": False}).encode(),
                                     headers={**headers, "Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as error:
            if error.code not in (400, 409):  # already exists
                raise SystemExit("STORAGE_RESTORE_FAILED: bucket creation HTTP %s" % error.code)
    verified = dict.fromkeys(manifest["counts"], 0)
    for item in manifest["files"]:
        bucket, name = item["bucket"], item["path"]
        body = (root / "storage" / bucket / name).read_bytes()
        url = _object_url(api_url, bucket, name)
        req = urllib.request.Request(url, data=body, method="POST", headers={**headers, "x-upsert": "true",
                                     "Content-Type": item.get("revision", {}).get("mimetype") or "application/octet-stream"})
        try:
            urllib.request.urlopen(req, timeout=60).read()
            served = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()
        except urllib.error.HTTPError as error:
            raise SystemExit("STORAGE_RESTORE_FAILED: HTTP %s in bucket %s" % (error.code, bucket))
        if len(served) != item["bytes"] or hashlib.sha256(served).hexdigest() != item["sha256"]:
            raise SystemExit("STORAGE_RESTORE_FAILED: served object differs from manifest in bucket %s" % bucket)
        verified[bucket] += 1
    if verified != manifest["counts"]:
        raise SystemExit("STORAGE_RESTORE_FAILED: count mismatch")
    print(json.dumps({"storage_objects_served_and_verified": verified}, sort_keys=True))


if __name__ == "__main__":
    command, *args = sys.argv[1:] or [""]
    handlers = {"expected": expected, "count-sql": count_sql, "compare": compare, "storage": storage, "classify": classify}
    if command not in handlers:
        raise SystemExit(__doc__)
    handlers[command](*args)
