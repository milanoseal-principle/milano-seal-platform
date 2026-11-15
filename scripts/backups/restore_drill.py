#!/usr/bin/env python3
"""Isolated restore drill helpers. Prints counts, booleans and hashes only, never row data,
object names or credentials.

Subcommands
  split-data <data.sql> <out_dir>
      Splits a data-only dump into app.sql (every non-managed schema, restored strictly) and one block
      per Supabase-managed table (managed.json).
  managed-sql <out_dir> <target_catalog.tsv> <managed_restore.sql> <report.json>
      Restores each managed block only where the target has the table and every dumped column;
      reports the rest with row counts; fails if auth.users, auth.identities, storage.buckets or
      storage.objects cannot be restored, or if any table that cannot be restored holds rows.
  expected <out.json> <schema.sql> <restored_data.sql>...
      Expected table list and per-table row counts, read from the restored data files themselves.
  count-sql <expected.json> <out.sql>
      SQL that counts the restored rows of every expected table (run against the isolated target).
  compare <expected.json> <restored.tsv> <summary.json>
      Fails unless every expected table exists in the target with exactly the dumped row count.
  classify <step> <stderr_file> [<dump_dir>]
      Prints sanitized facts for a failed step: failure class, SQLSTATE, dump file and line, and for
      roles.sql/schema.sql the failing statement's leading SQL keywords. Database diagnostics can quote restored
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


def expected(out, schema_sql, *data_files):
    """Expected public tables (from the schema dump) and rows (from every data file that was
    actually restored, read from their own COPY blocks)."""
    tables = sorted(t for t in created_tables(schema_sql) if t.startswith("public."))
    rows = {}
    for data_file in data_files:
        rows.update(copy_counts(data_file))
    if not tables:
        raise SystemExit("Schema dump declares no public tables")
    Path(out).write_text(json.dumps({"public_tables": tables, "rows": rows}, indent=1, sort_keys=True))
    print(json.dumps({"public_tables": len(tables), "tables_with_rows_in_dump": len(rows),
                      "rows_in_dump": sum(rows.values())}))


# Schemas owned by the Supabase platform. A `supabase db dump --data-only` writes their rows too
# (auth.*, storage.*, supabase_functions.*, ...), but their table definitions belong to the
# platform version, not to the backup: a hosted project can carry managed tables or columns that a
# local Supabase stack of a different version lacks (2026-11-14: hosted storage has
# bucket_lifecycle_states and lifecycle_abandoned_artifacts; the local target does not).
MANAGED_SCHEMAS = {"auth", "storage", "realtime", "_realtime", "supabase_functions", "vault", "net", "cron",
                   "pgbouncer", "graphql", "graphql_public", "extensions", "supabase_migrations", "pgsodium"}
# Managed tables that must restore for recovery to count: sign-in records and Storage metadata.
REQUIRED_MANAGED = {"auth.users", "auth.identities", "storage.buckets", "storage.objects"}
COPY_FULL = re.compile(r'^COPY\s+((?:"[^"]+"|\w+)\.(?:"[^"]+"|\w+))\s*(?:\(([^)]*)\))?\s+FROM\s+stdin;\s*$', re.I)
SETVAL = re.compile(r"""^SELECT\s+pg_catalog\.setval\('((?:"[^"]+"|\w+)\.(?:"[^"]+"|\w+))'""", re.I)


def _columns(raw):
    return [a or b for a, b in re.findall(r'"((?:[^"]|"")+)"|(\w+)', raw or "")]


def split_data(data_sql, outdir):
    """Split a data-only dump into the application part (restored strictly as a whole) and one
    block per Supabase-managed table (restored only where the target has a compatible table)."""
    out = Path(outdir)
    (out / "managed").mkdir(parents=True, exist_ok=True)
    head, tail, app, setvals, managed = [], [], [], [], []
    current, seen_copy = None, False
    with open(data_sql, encoding="utf-8", errors="strict") as fh:
        for line in fh:
            if current is not None:
                current["lines"].append(line)
                if line.rstrip("\n") == "\\.":
                    current = None
                else:
                    block["rows"] += 1
                continue
            match = COPY_FULL.match(line.rstrip("\n"))
            if match:
                seen_copy = True
                table = _name(match.group(1))
                block = {"table": table, "columns": _columns(match.group(2)), "rows": 0, "lines": [line]}
                current = block
                (managed if table.split(".", 1)[0] in MANAGED_SCHEMAS else app).append(block)
                tail = []
                continue
            seq = SETVAL.match(line)
            if seq:
                setvals.append((_name(seq.group(1)), line))
                continue
            stripped = line.strip()
            if not stripped or stripped.startswith("--"):
                continue  # comments and blank lines between blocks carry nothing
            if not seen_copy:
                head.append(line)
            elif stripped.startswith(("RESET", "\\unrestrict")):
                tail.append(line)
            else:
                raise SystemExit("Unexpected statement between COPY blocks in data dump")
    if current is not None:
        raise SystemExit("Unterminated COPY block in dump")
    app_setvals = [l for name, l in setvals if name.split(".", 1)[0] not in MANAGED_SCHEMAS]
    managed_setvals = [{"sequence": name, "sql": l} for name, l in setvals if name.split(".", 1)[0] in MANAGED_SCHEMAS]
    (out / "app.sql").write_text("".join(head + [l for b in app for l in b["lines"]] + app_setvals + tail))
    index = []
    for n, b in enumerate(managed):
        path = out / "managed" / ("%04d.sql" % n)
        path.write_text("".join(b["lines"]))
        index.append({"table": b["table"], "columns": b["columns"], "rows": b["rows"], "file": path.name})
    (out / "managed.json").write_text(json.dumps({"head": "".join(head), "tail": "".join(tail), "blocks": index,
                                                  "setvals": managed_setvals}, indent=1))
    print(json.dumps({"application_tables": len(app), "application_rows": sum(b["rows"] for b in app),
                      "managed_tables": len(managed), "managed_rows": sum(b["rows"] for b in managed)}, sort_keys=True))


def managed_sql(outdir, catalog_tsv, out_sql, report_json):
    """Build the managed-table restore from the blocks the target can accept as dumped. A block is
    restorable when the target has the table and every dumped column. Nothing is created, dropped
    or altered; every block that cannot be restored is reported with its row count, and the restore
    fails unless every such block is empty."""
    out = Path(outdir)
    spec = json.loads((out / "managed.json").read_text())
    catalog, sequences = {}, set()
    for line in Path(catalog_tsv).read_text().splitlines():
        if not line.strip():
            continue
        kind, name, column = (line.split("\t") + ["", ""])[:3]
        if kind == "S":
            sequences.add(name)
        else:
            catalog.setdefault(name, set()).add(column)
    parts = [spec["head"], "SET session_replication_role = replica;\n"]
    restored, not_restorable = {}, []
    for block in spec["blocks"]:
        table, columns = block["table"], block["columns"]
        if table not in catalog:
            not_restorable.append({"table": table, "rows": block["rows"], "reason": "TABLE_NOT_IN_TARGET"})
            continue
        missing = sorted(set(columns) - catalog[table])
        if missing:
            not_restorable.append({"table": table, "rows": block["rows"], "reason": "COLUMNS_NOT_IN_TARGET", "columns": missing})
            continue
        parts.append((out / "managed" / block["file"]).read_text())
        restored[table] = block["rows"]
    parts += [s["sql"] for s in spec["setvals"] if s["sequence"] in sequences]
    parts.append(spec["tail"])
    Path(out_sql).write_text("".join(parts))
    dumped = {b["table"] for b in spec["blocks"]}
    required_failures = sorted((REQUIRED_MANAGED - dumped) | {b["table"] for b in not_restorable if b["table"] in REQUIRED_MANAGED})
    report = {"managed_tables_restored": restored, "managed_rows_restored": sum(restored.values()),
              "managed_tables_not_restorable": not_restorable,
              "managed_rows_not_restorable": sum(b["rows"] for b in not_restorable),
              "required_managed_failures": required_failures}
    Path(report_json).write_text(json.dumps(report, indent=1, sort_keys=True))
    print(json.dumps(report, sort_keys=True))  # table and column names and counts only
    if required_failures:
        raise SystemExit("REQUIRED_MANAGED_TABLE_NOT_RESTORABLE")
    if report["managed_rows_not_restorable"]:
        # A managed table the target lacks is only acceptable when the backup holds no rows for it:
        # archived rows are never left behind on a restore reported as complete.
        raise SystemExit("MANAGED_ROWS_NOT_RESTORABLE")


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
    ("ROLE_MEMBERSHIP_REQUIRED", re.compile(r"must be able to SET ROLE|must be member of role", re.I)),
    ("SUPERUSER_REQUIRED", re.compile(r"must be superuser|Non-superuser owned event trigger|only superusers? can", re.I)),
    ("PERMISSION_DENIED", re.compile(r"permission denied|must be owner", re.I)),
    ("UNIQUE_VIOLATION", re.compile(r"duplicate key value|unique constraint", re.I)),
    ("CHECK_OR_NOT_NULL_VIOLATION", re.compile(r"violates (check|not-null) constraint", re.I)),
    ("FOREIGN_KEY_VIOLATION", re.compile(r"violates foreign key constraint", re.I)),
    ("EXTENSION_UNAVAILABLE", re.compile(r"extension \S+ is not available|could not open extension control file", re.I)),
    ("UNSUPPORTED_SETTING", re.compile(r"unrecognized configuration parameter", re.I)),
    ("MISSING_OBJECT", re.compile(r"does not exist", re.I)),
    ("ALREADY_EXISTS", re.compile(r"already exists", re.I)),
    ("SYNTAX_ERROR", re.compile(r"syntax error", re.I)),
    ("TYPE_OR_FORMAT_MISMATCH", re.compile(r"invalid input syntax|invalid byte sequence|extra data after last|missing data for column", re.I)),
    ("TRIGGER_REJECTED_ROW", re.compile(r"\braise\b|PL/pgSQL function", re.I)),
    ("CONNECTION_FAILED", re.compile(r"could not connect|connection to server|server closed the connection", re.I)),
)
# Files whose name and line number may be reported. Their content is never printed.
DIAGNOSTIC_FILES = {"roles.sql", "schema.sql", "data.sql", "app.sql", "managed_restore.sql", "count.sql",
                    "restore_drill_checks.sql", "migration_rehearsal_checks.sql"}
# Repository migrations (rehearsed on the restored copy) are reviewed source, never data: their
# names, lines and statement keywords may be reported like a definition-only dump.
REPO_MIGRATION = re.compile(r"^\d{14}_[a-z0-9_]+\.sql$")
DATA_FILES = {"data.sql", "app.sql", "managed_restore.sql"}
# Statement keywords that may be reported for a failure in a definition-only dump.
STATEMENT_WORDS = {"ALTER", "CREATE", "DROP", "GRANT", "REVOKE", "COMMENT", "SET", "SELECT", "COPY", "INSERT",
                   "TABLE", "FUNCTION", "PROCEDURE", "ROLE", "SCHEMA", "EXTENSION", "TRIGGER", "EVENT", "POLICY",
                   "INDEX", "UNIQUE", "VIEW", "MATERIALIZED", "SEQUENCE", "TYPE", "DOMAIN", "PUBLICATION", "DEFAULT",
                   "PRIVILEGES", "OR", "REPLACE", "AGGREGATE", "OPERATOR", "CAST", "RULE", "SERVER", "FOREIGN",
                   "ON", "OWNER", "IF", "NOT", "EXISTS"}
DEFINITION_FILES = {"roles.sql", "schema.sql"}


def _first_error(text):
    for line in text.splitlines():
        if re.search(r"\b(ERROR|FATAL):", line):
            return line
    return ""


def classify_text(text):
    line = _first_error(text) or text
    for code, pattern in FAILURE_CLASSES:
        if pattern.search(line):
            return code
    return "UNCLASSIFIED"


def diagnose(text, dump_root=None):
    """Sanitized facts about the first error: class, SQLSTATE, dump file and line, and for a
    definition-only dump the statement's leading keywords. Never message text or values."""
    line = _first_error(text)
    facts = {"class": classify_text(text)}
    state = re.search(r"\b(?:ERROR|FATAL):\s+([0-9A-Z]{5}):", line)
    if state:
        facts["sqlstate"] = state.group(1)
    where = re.match(r"psql:(?:.*/)?([A-Za-z0-9_.-]+):(\d+):", line)
    if where and (where.group(1) in DIAGNOSTIC_FILES or REPO_MIGRATION.match(where.group(1))):
        facts["file"], facts["line"] = where.group(1), int(where.group(2))
        if dump_root and where.group(1) in DATA_FILES:
            relation = _relation_at(Path(dump_root) / where.group(1), int(where.group(2)))
            if relation:
                # A relation name is schema metadata, never row data.
                facts["relation"] = relation
                facts["relation_schema"] = "managed" if relation.split(".", 1)[0] in MANAGED_SCHEMAS else "application"
                schema_sql = Path(dump_root) / "schema.sql"
                if schema_sql.exists():
                    facts["defined_in_schema_dump"] = relation in created_tables(schema_sql)
        if dump_root and (where.group(1) in DEFINITION_FILES or REPO_MIGRATION.match(where.group(1))):
            try:
                with open(Path(dump_root) / where.group(1), encoding="utf-8", errors="replace") as fh:
                    lines = fh.readlines()
                # psql reports the line where the failing statement ends; walk back to its start.
                index = min(int(where.group(2)), len(lines)) - 1
                while index > 0 and lines[index - 1].strip() and not lines[index - 1].rstrip().endswith(";"):
                    index -= 1
                words = []
                for word in re.findall(r"[A-Za-z]+", lines[index] if lines else ""):
                    if word.upper() not in STATEMENT_WORDS:
                        break
                    words.append(word.upper())
                if words:
                    facts["statement"] = " ".join(words[:4])
            except OSError:
                pass
    return facts


def _relation_at(path, line_number):
    """The relation a data file's statement at line_number refers to: the COPY block enclosing that
    line, or the sequence of a setval at that line."""
    relation = None
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            for number, line in enumerate(fh, 1):
                if number > line_number:
                    break
                copy = COPY_FULL.match(line.rstrip("\n"))
                if copy:
                    relation = _name(copy.group(1))
                elif line.rstrip("\n") == "\\." and number < line_number:
                    relation = None
                seq = SETVAL.match(line)
                if seq and number == line_number:
                    relation = _name(seq.group(1))
    except OSError:
        return None
    return relation


def classify(step, stderr_file, dump_root=None):
    try:
        text = Path(stderr_file).read_text(errors="replace")
    except OSError:
        text = ""
    facts = diagnose(text, dump_root)
    # Only allowlisted facts are printed; the diagnostics stay in the protected temporary directory,
    # which the workflow deletes in its always() cleanup step.
    detail = " ".join("%s=%s" % (k, str(v).replace(" ", "_")) for k, v in facts.items())
    print("::error::RESTORE_STEP_FAILED step=%s %s" % (re.sub(r"[^a-z0-9_-]", "", step.lower()), detail))


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
    handlers = {"expected": expected, "count-sql": count_sql, "compare": compare, "storage": storage, "classify": classify,
                "split-data": split_data, "managed-sql": managed_sql}
    if command not in handlers:
        raise SystemExit(__doc__)
    handlers[command](*args)
