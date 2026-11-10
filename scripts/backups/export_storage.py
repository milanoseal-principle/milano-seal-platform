#!/usr/bin/env python3
"""Read-only, complete backup of Supabase Storage binaries with integrity manifest."""
import csv
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
import urllib.error
import urllib.parse
import urllib.request

out = Path(sys.argv[1])
count_file = Path(sys.argv[2])
ref = os.environ["SUPABASE_PROJECT_REF"]
key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
base = f"https://{ref}.supabase.co/storage/v1"
buckets = ("documents", "evidence", "deal-documents")
out.mkdir(parents=True, exist_ok=True)

def request(url, payload=None):
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method="POST" if payload is not None else "GET")
    return urllib.request.urlopen(req, timeout=90)

def enumerate_objects(bucket, prefix=""):
    offset = 0
    while True:
        url = f"{base}/object/list/{urllib.parse.quote(bucket, safe='')}"
        with request(url, {"prefix": prefix, "limit": 1000, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}) as response:
            rows = json.load(response)
        if not isinstance(rows, list):
            raise RuntimeError("Unexpected storage listing response")
        for item in rows:
            name = item["name"]
            if item.get("id") is None:
                yield from enumerate_objects(bucket, prefix + name + "/")
            else:
                yield prefix + name
        if len(rows) < 1000:
            break
        offset += len(rows)

expected = {}
with count_file.open(newline="") as fh:
    for bucket, count in csv.reader(fh, delimiter="\t"):
        expected[bucket] = int(count)
if set(expected) - set(buckets):
    raise RuntimeError("Unrecognized nonempty Storage bucket: " + repr(set(expected)-set(buckets)))

manifest = {"project_ref": ref, "files": [], "counts": {}}
for bucket in buckets:
    names = list(enumerate_objects(bucket))
    if len(names) != len(set(names)):
        raise RuntimeError(f"Duplicate listing for {bucket}")
    if len(names) != expected.get(bucket, 0):
        raise RuntimeError(f"Storage object mismatch in {bucket}: API={len(names)}, database={expected.get(bucket, 0)}")
    manifest["counts"][bucket] = len(names)
    for name in names:
        path = PurePosixPath(name)
        if path.is_absolute() or not path.parts or any(p in (".", "..") for p in path.parts):
            raise RuntimeError("Unsafe object path")
        target = out / bucket / Path(*path.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        url = f"{base}/object/authenticated/{urllib.parse.quote(bucket, safe='')}/{urllib.parse.quote(name, safe='/')}"
        digest = hashlib.sha256()
        size = 0
        with request(url) as response, target.open("xb") as f:
            while chunk := response.read(1024 * 1024):
                f.write(chunk)
                digest.update(chunk)
                size += len(chunk)
        manifest["files"].append({"bucket": bucket, "path": name, "bytes": size, "sha256": digest.hexdigest()})

(out / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True))
print("Verified Storage objects:", {x: manifest["counts"][x] for x in buckets})
