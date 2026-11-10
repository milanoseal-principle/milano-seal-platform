#!/usr/bin/env python3
"""Read-only Storage export; revision checks do not imply a shared DB snapshot."""
import csv
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
import tempfile
import urllib.parse
import urllib.request

BUCKETS = ("documents", "evidence", "deal-documents")


def safe_path(name):
    if not isinstance(name, str) or not name or any(ord(c) < 32 or ord(c) == 127 for c in name):
        raise RuntimeError("Unsafe object path")
    path = PurePosixPath(name)
    if path.is_absolute() or any(p in ("", ".", "..") for p in name.split("/")):
        raise RuntimeError("Unsafe object path")
    return path


def file_record(path, allow_empty=False):
    if any(p.is_symlink() for p in (path, *path.parents)) or not path.is_file():
        raise RuntimeError("Invalid backup file")
    digest, size = hashlib.sha256(), 0
    with path.open("rb") as fh:
        while chunk := fh.read(1024 * 1024):
            size += len(chunk)
            digest.update(chunk)
    if size == 0 and not allow_empty:
        raise RuntimeError("Empty backup file")
    return {"bytes": size, "sha256": digest.hexdigest()}


def database_inventory(root):
    result = {name: file_record(root / name) for name in
              ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump")}
    counts = root / "storage-object-counts.tsv"
    if counts.exists() or counts.is_symlink():
        result[counts.name] = file_record(counts, allow_empty=True)
    with (root / "auth-storage-data.dump").open("rb") as fh:
        if fh.read(5) != b"PGDMP":
            raise RuntimeError("Invalid custom database archive header")
    return result


def validate_revision(revision):
    if (not isinstance(revision, dict) or not isinstance(revision.get("id"), str)
            or not revision["id"] or not isinstance(revision.get("updated_at"), str)
            or not revision["updated_at"] or type(revision.get("size")) is not int
            or revision["size"] < 0 or (revision.get("etag") is not None
                                      and not isinstance(revision["etag"], str))):
        raise RuntimeError("Object revision unavailable or invalid")
    return revision


def validate_database_url(value, project_ref):
    """Reject wrong targets, transaction pools and non-TLS URLs without echoing secrets."""
    try:
        parsed = urllib.parse.urlsplit(value)
        query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
        direct = parsed.hostname == f"db.{project_ref}.supabase.co"
        session = (bool(parsed.hostname) and parsed.hostname.endswith(".pooler.supabase.com")
                   and urllib.parse.unquote(parsed.username or "").endswith("." + project_ref))
        valid = (parsed.scheme in ("postgres", "postgresql") and (direct or session)
                 and parsed.port in (None, 5432) and parsed.path == "/postgres"
                 and bool(parsed.username) and bool(parsed.password) and not parsed.fragment
                 and query.get("sslmode") in (["require"], ["verify-ca"], ["verify-full"])
                 and not set(query).intersection({"host", "hostaddr", "port", "user", "password",
                                                  "dbname", "service", "servicefile", "passfile"}))
    except (ValueError, TypeError, AttributeError):
        valid = False
    if not valid:
        raise RuntimeError("Invalid production backup database target or TLS configuration") from None


def request(url, payload=None):
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=json.dumps(payload).encode() if payload is not None else None,
                                 headers=headers, method="POST" if payload is not None else "GET")
    return urllib.request.urlopen(req, timeout=90)


def enumerate_objects(base, bucket, prefix=""):
    offset = 0
    seen = set()
    while True:
        url = f"{base}/object/list/{urllib.parse.quote(bucket, safe='')}"
        with request(url, {"prefix": prefix, "limit": 1000, "offset": offset,
                           "sortBy": {"column": "name", "order": "asc"}}) as response:
            rows = json.load(response)
        if not isinstance(rows, list):
            raise RuntimeError("Unexpected storage listing response")
        if not rows:
            return
        for item in rows:
            if not isinstance(item, dict):
                raise RuntimeError("Unexpected storage listing item")
            name = item.get("name")
            safe_path(name)
            if "/" in name or name in seen:
                raise RuntimeError("Duplicate or invalid storage listing")
            seen.add(name)
            if "id" not in item:
                raise RuntimeError("Object revision unavailable")
            if item["id"] is None:
                if item.get("metadata") is not None:
                    raise RuntimeError("Invalid folder listing")
                yield from enumerate_objects(base, bucket, prefix + name + "/")
            else:
                if not isinstance(item["id"], str) or not item["id"] or not item.get("updated_at"):
                    raise RuntimeError("Object revision unavailable")
                metadata = item.get("metadata") or {}
                if not isinstance(metadata, dict):
                    raise RuntimeError("Invalid object metadata")
                revision = {"id": item["id"], "updated_at": item["updated_at"],
                            "etag": metadata.get("eTag"), "size": metadata.get("size")}
                yield prefix + name, validate_revision(revision)
        # Advance by actual rows; a server cap smaller than 1000 is not EOF.
        offset += len(rows)


def inventory(base, bucket):
    result = {}
    for name, revision in enumerate_objects(base, bucket):
        if name in result:
            raise RuntimeError("Duplicate object in inventory")
        result[name] = revision
    return result


def export(out, count_file):
    ref = os.environ["SUPABASE_PROJECT_REF"]
    if len(ref) != 20 or not ref.isascii() or not ref.isalnum() or ref.lower() != ref:
        raise RuntimeError("Invalid Supabase project reference")
    base = f"https://{ref}.supabase.co/storage/v1"
    if any(p.is_symlink() for p in (out, *out.parents)):
        raise RuntimeError("Symlink in export destination")
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.json"
    if manifest_path.exists() or manifest_path.is_symlink():
        raise RuntimeError("Export destination already has a manifest")
    expected = {}
    with count_file.open(newline="") as fh:
        for bucket, count in csv.reader(fh, delimiter="\t"):
            if bucket in expected or int(count) < 0:
                raise RuntimeError("Invalid database bucket counts")
            expected[bucket] = int(count)
    if set(expected) - set(BUCKETS):
        raise RuntimeError("Unrecognized nonempty Storage bucket")
    database = database_inventory(out.parent / "database")
    initial = {bucket: inventory(base, bucket) for bucket in BUCKETS}
    manifest = {"format_version": 2, "project_ref": ref, "files": [], "counts": {}, "database": database,
                "consistency": "revision_checked_not_transactional_snapshot"}
    for bucket, objects in initial.items():
        if len(objects) != expected.get(bucket, 0):
            raise RuntimeError(f"Storage object count mismatch for {bucket}")
        manifest["counts"][bucket] = len(objects)
        for name, revision in sorted(objects.items()):
            path = safe_path(name)
            target = out / bucket / Path(*path.parts)
            if any(p.is_symlink() for p in [target, *target.parents]):
                raise RuntimeError("Symlink in export destination")
            target.parent.mkdir(parents=True, exist_ok=True)
            url = f"{base}/object/authenticated/{urllib.parse.quote(bucket, safe='')}/{urllib.parse.quote(name, safe='/')}"
            digest, size = hashlib.sha256(), 0
            with request(url) as response, target.open("xb") as fh:
                while chunk := response.read(1024 * 1024):
                    fh.write(chunk)
                    digest.update(chunk)
                    size += len(chunk)
            if revision["size"] is not None and revision["size"] != size:
                raise RuntimeError(f"Storage byte count mismatch for {bucket}")
            manifest["files"].append({"bucket": bucket, "path": name, "bytes": size,
                                      "sha256": digest.hexdigest(), "revision": revision})
    # Recheck ALL buckets after ALL downloads, including earlier buckets.
    for bucket in BUCKETS:
        if inventory(base, bucket) != initial[bucket]:
            raise RuntimeError(f"Storage inventory or revision changed during export for {bucket}; retry backup")
    if database_inventory(out.parent / "database") != database:
        raise RuntimeError("Database exports changed during Storage export")
    # Commit the success marker atomically only after every check and durable write.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", dir=out, prefix=".manifest-", delete=False) as fh:
            temporary = Path(fh.name)
            json.dump(manifest, fh, indent=2, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())
        os.link(temporary, manifest_path)  # Atomic and refuses an existing destination.
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print("Verified Storage objects:", manifest["counts"])


if __name__ == "__main__":
    export(Path(sys.argv[1]), Path(sys.argv[2]))
