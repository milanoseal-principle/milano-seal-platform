#!/usr/bin/env python3
"""Validate an extracted Milano Seal backup without connecting to production."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys

root = Path(sys.argv[1]).resolve()
manifest_path = root / "storage" / "manifest.json"
if any(p.is_symlink() for p in (root / "storage", manifest_path)):
    raise SystemExit("Symlink in backup metadata")
manifest = json.loads(manifest_path.read_text())
required_buckets = {"documents", "evidence", "deal-documents"}
if set(manifest["counts"]) != required_buckets:
    raise SystemExit("Backup bucket inventory incomplete")
seen = set()
actual = {key: 0 for key in required_buckets}
for item in manifest["files"]:
    bucket, name = item["bucket"], item["path"]
    if bucket not in required_buckets:
        raise SystemExit("Unknown bucket")
    p = PurePosixPath(name)
    if p.is_absolute() or not p.parts or any(x in ("", ".", "..") for x in name.split("/")):
        raise SystemExit("Unsafe path")
    rel = Path("storage") / bucket / Path(*p.parts)
    original = root / rel
    if any(part.is_symlink() for part in (original, *original.parents)):
        raise SystemExit("Symlink in backup object path")
    target = original.resolve()
    if not target.is_relative_to(root):
        raise SystemExit("Object escaped extraction directory")
    if (bucket, name) in seen:
        raise SystemExit("Duplicate object in manifest")
    seen.add((bucket, name))
    if not target.is_file() or target.is_symlink():
        raise SystemExit(f"Missing or invalid object: {bucket}/{name}")
    digest = hashlib.sha256()
    size = 0
    with target.open("rb") as f:
        while block := f.read(1024 * 1024):
            size += len(block)
            digest.update(block)
    if size != item["bytes"] or digest.hexdigest() != item["sha256"]:
        raise SystemExit(f"Checksum mismatch: {bucket}/{name}")
    actual[bucket] += 1
if actual != manifest["counts"]:
    raise SystemExit("Count mismatch")
for name in ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump"):
    f = root / "database" / name
    if f.is_symlink() or f.parent.is_symlink() or not f.is_file() or f.stat().st_size == 0:
        raise SystemExit(f"Missing or empty database export: {name}")
print("PASS: complete database exports and verified private Storage files", actual)
