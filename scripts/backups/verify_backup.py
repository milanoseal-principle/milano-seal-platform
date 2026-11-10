#!/usr/bin/env python3
"""Verify extracted backup integrity offline; never equates checksums with restore."""
import json
import hashlib
from pathlib import Path
import re
import sys
import tarfile
from export_storage import BUCKETS, database_inventory, safe_path, validate_revision


def inspect_archive(path):
    original = path.absolute()
    if any(p.is_symlink() for p in (original, *original.parents)) or not original.is_file():
        raise SystemExit("Invalid archive file")
    seen = set()
    files = set()
    with tarfile.open(original, "r:") as archive:
        for member in archive:
            if not (member.isfile() or member.isdir()) or member.linkname or member.issparse():
                raise SystemExit("Unsafe archive entry type")
            name = member.name.removeprefix("./")
            if name in ("", ".") and member.isdir():
                continue
            parts = safe_path(name).parts
            if parts[0] not in ("database", "storage") or name in seen:
                raise SystemExit("Unsafe or duplicate archive path")
            seen.add(name)
            if member.isfile():
                files.add(name)
    required = {"storage/manifest.json", *("database/" + name for name in
                 ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump"))}
    if not required.issubset(files):
        raise SystemExit("Archive missing required exports")
    print("PASS: archive paths/types only; extracted bytes and restoration remain unverified")


if len(sys.argv) == 3 and sys.argv[1] == "--archive":
    inspect_archive(Path(sys.argv[2]))
    raise SystemExit(0)

original_root = Path(sys.argv[1]).absolute()
if any(p.is_symlink() for p in (original_root, *original_root.parents)):
    raise SystemExit("Symlink in backup root")
root = original_root.resolve()
if {p.name for p in root.iterdir()} != {"database", "storage"}:
    raise SystemExit("Unexpected backup root content")
manifest_path = root / "storage" / "manifest.json"
if any(p.is_symlink() for p in (root / "storage", manifest_path)):
    raise SystemExit("Symlink in backup metadata")
manifest = json.loads(manifest_path.read_text())
if not isinstance(manifest, dict) or manifest.get("format_version") != 2:
    raise SystemExit("Unsupported or corrupt integrity manifest")
if (not isinstance(manifest.get("project_ref"), str)
        or not re.fullmatch(r"[a-z0-9]{20}", manifest["project_ref"])):
    raise SystemExit("Invalid source project identity")
required_buckets = set(BUCKETS)
counts = manifest.get("counts")
if (not isinstance(counts, dict) or set(counts) != required_buckets
        or any(type(n) is not int or n < 0 for n in counts.values())
        or not isinstance(manifest.get("files"), list)):
    raise SystemExit("Backup bucket inventory incomplete or invalid")
seen = set()
actual = dict.fromkeys(required_buckets, 0)
for item in manifest["files"]:
    if not isinstance(item, dict):
        raise SystemExit("Invalid object record")
    bucket, name = item.get("bucket"), item.get("path")
    if bucket not in required_buckets:
        raise SystemExit("Unknown bucket")
    p = safe_path(name)
    revision = validate_revision(item.get("revision"))
    if (type(item.get("bytes")) is not int or item["bytes"] < 0
            or revision["size"] != item["bytes"] or not isinstance(item.get("sha256"), str)
            or not re.fullmatch(r"[a-f0-9]{64}", item["sha256"])):
        raise SystemExit("Invalid object integrity record")
    original = root / "storage" / bucket / Path(*p.parts)
    if any(part.is_symlink() for part in (original, *original.parents)):
        raise SystemExit("Symlink in backup object path")
    target = original.resolve()
    if not target.is_relative_to(root) or not target.is_file():
        raise SystemExit("Missing or invalid backup object")
    if (bucket, name) in seen:
        raise SystemExit("Duplicate object in manifest")
    seen.add((bucket, name))
    # Empty objects are valid Storage objects; verify their hash as well.
    digest = hashlib.sha256()
    size = 0
    with target.open("rb") as fh:
        while block := fh.read(1024 * 1024):
            size += len(block)
            digest.update(block)
    if size != item["bytes"] or digest.hexdigest() != item["sha256"]:
        raise SystemExit("Object checksum mismatch")
    actual[bucket] += 1
if actual != counts:
    raise SystemExit("Count mismatch")
# Reject extra bytes, links and special files, including unlisted objects.
def walk(directory):
    for child in directory.iterdir():
        if child.is_symlink():
            raise SystemExit("Symlink in extracted backup")
        if child.is_dir():
            yield from walk(child)
        elif child.is_file():
            yield child
        else:
            raise SystemExit("Special file in extracted backup")
expected_files = {manifest_path, *(root / 'storage' / bucket / name for bucket, name in seen)}
if set(walk(root / "storage")) != expected_files:
    raise SystemExit("Unlisted Storage content")
if set(walk(root / "database")) != {root / 'database' / name for name in
        ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump", "storage-object-counts.tsv")
        if (root / 'database' / name).exists()}:
    raise SystemExit("Unlisted database content")
if database_inventory(root / "database") != manifest.get("database"):
    raise SystemExit("Database export checksum mismatch")
print("PASS: export bytes and private object integrity; restoration remains unverified", actual)
