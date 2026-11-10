#!/usr/bin/env python3
"""Offline backup regression tests: no credentials, network or customer records."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("export_storage", HERE / "export_storage.py")
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def obj(name="file.pdf", version="one", size=3):
    return {"name": name, "id": "synthetic-object", "updated_at": version,
            "metadata": {"eTag": version, "size": size}}


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.counts = self.root / "counts.tsv"
        self.counts.write_text("documents\t1\n")
        self.out = self.root / "storage"
        self.env = patch.dict(os.environ, {"SUPABASE_PROJECT_REF": "a" * 20})
        self.env.start()
        self.addCleanup(self.env.stop)

    def perform(self, fake):
        with patch.object(exporter, "request", side_effect=fake), contextlib.redirect_stdout(io.StringIO()):
            exporter.export(self.out, self.counts)

    def api(self, mutate=None):
        calls = {b: 0 for b in exporter.BUCKETS}
        def fake(url, payload=None):
            if payload is None:
                return io.BytesIO(b"pdf")
            bucket = url.rsplit("/", 1)[-1]
            if payload["offset"]:
                return io.BytesIO(b"[]")
            calls[bucket] += 1
            rows = [obj()] if bucket == "documents" else []
            if mutate:
                rows = mutate(bucket, calls[bucket], rows)
            return io.BytesIO(json.dumps(rows).encode())
        return fake

    def test_success_records_revision_and_hash(self):
        self.perform(self.api())
        manifest = json.loads((self.out / "manifest.json").read_text())
        self.assertEqual(manifest["files"][0]["sha256"], hashlib.sha256(b"pdf").hexdigest())
        self.assertEqual(manifest["files"][0]["revision"]["updated_at"], "one")

    def test_short_pages_are_not_end_of_inventory(self):
        offsets = []
        def fake(url, payload=None):
            offsets.append(payload["offset"])
            rows = [obj(str(payload["offset"]) + ".pdf")] if payload["offset"] < 3 else []
            return io.BytesIO(json.dumps(rows).encode())
        with patch.object(exporter, "request", side_effect=fake):
            self.assertEqual(len(exporter.inventory("https://example.invalid", "documents")), 3)
        self.assertEqual(offsets, [0, 1, 2, 3])

    def test_nested_and_duplicate_basenames(self):
        def fake(url, payload):
            if payload["offset"]:
                rows = []
            elif not payload["prefix"]:
                rows = [{"name": "nested", "id": None}, obj()]
            else:
                rows = [obj()]
            return io.BytesIO(json.dumps(rows).encode())
        with patch.object(exporter, "request", side_effect=fake):
            self.assertEqual(set(exporter.inventory("https://example.invalid", "documents")), {"file.pdf", "nested/file.pdf"})

    def test_same_name_overwrite_fails_without_manifest(self):
        def mutate(bucket, call, rows):
            return [obj(version="two")] if bucket == "documents" and call == 2 else rows
        with self.assertRaisesRegex(RuntimeError, "revision changed"):
            self.perform(self.api(mutate))
        self.assertFalse((self.out / "manifest.json").exists())

    def test_earlier_bucket_change_detected_after_later_download(self):
        self.counts.write_text("documents\t1\nevidence\t1\n")
        evidence_downloaded = False
        calls = {b: 0 for b in exporter.BUCKETS}
        def fake(url, payload=None):
            nonlocal evidence_downloaded
            if payload is None:
                if "/evidence/" in url:
                    evidence_downloaded = True
                return io.BytesIO(b"pdf")
            bucket = url.rsplit("/", 1)[-1]
            if payload["offset"]:
                rows = []
            else:
                calls[bucket] += 1
                rows = [obj(version="two" if bucket == "documents" and evidence_downloaded else "one")] if bucket != "deal-documents" else []
            return io.BytesIO(json.dumps(rows).encode())
        with self.assertRaisesRegex(RuntimeError, "revision changed"):
            self.perform(fake)

    def test_duplicate_page_fails_closed(self):
        with patch.object(exporter, "request", side_effect=lambda *a, **kw: io.BytesIO(json.dumps([obj()]).encode())):
            with self.assertRaisesRegex(RuntimeError, "Duplicate"):
                exporter.inventory("https://example.invalid", "documents")

    def test_missing_revision_fails(self):
        with self.assertRaisesRegex(RuntimeError, "revision unavailable"):
            self.perform(self.api(lambda b, c, rows: [dict(obj(), updated_at=None)] if rows else rows))

    def test_wrong_download_size_fails(self):
        with self.assertRaisesRegex(RuntimeError, "byte count mismatch"):
            self.perform(self.api(lambda b, c, rows: [obj(size=4)] if rows else rows))

    def test_empty_buckets(self):
        self.counts.write_text("")
        self.perform(lambda *a, **kw: io.BytesIO(b"[]"))
        self.assertEqual(json.loads((self.out / "manifest.json").read_text())["counts"], dict.fromkeys(exporter.BUCKETS, 0))

    def test_listing_error_has_no_success_manifest(self):
        with self.assertRaises(OSError):
            self.perform(lambda *a, **kw: (_ for _ in ()).throw(OSError("synthetic failure")))
        self.assertFalse((self.out / "manifest.json").exists())

    def test_count_mismatch_fails(self):
        self.counts.write_text("documents\t2\n")
        with self.assertRaisesRegex(RuntimeError, "count mismatch"):
            self.perform(self.api())

    def test_paths_are_rejected_before_normalization(self):
        for name in ("../file", "folder/../file", "./file", "/file", "folder//file", "file\n.pdf", ""):
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                exporter.safe_path(name)


class VerifierTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "storage/documents").mkdir(parents=True)
        (self.root / "database").mkdir()
        for name in ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump"):
            (self.root / "database" / name).write_bytes(b"synthetic export")
        (self.root / "storage/documents/file.pdf").write_bytes(b"pdf")
        self.manifest = {"counts": {"documents": 1, "evidence": 0, "deal-documents": 0}, "files": [
            {"bucket": "documents", "path": "file.pdf", "bytes": 3, "sha256": hashlib.sha256(b"pdf").hexdigest()}]}

    def run_verifier(self):
        (self.root / "storage/manifest.json").write_text(json.dumps(self.manifest))
        return subprocess.run([sys.executable, str(HERE / "verify_backup.py"), str(self.root)], capture_output=True, text=True).returncode

    def test_valid_archive(self):
        self.assertEqual(self.run_verifier(), 0)

    def test_corrupt_bytes(self):
        (self.root / "storage/documents/file.pdf").write_bytes(b"bad")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_file_symlink_within_archive_is_rejected(self):
        p = self.root / "storage/documents/file.pdf"
        p.rename(p.with_name("other.pdf"))
        p.symlink_to("other.pdf")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_directory_symlink_within_archive_is_rejected(self):
        p = self.root / "storage/documents"
        p.rename(self.root / "storage/other")
        p.symlink_to("other", target_is_directory=True)
        self.assertNotEqual(self.run_verifier(), 0)

    def test_database_symlink_rejected(self):
        p = self.root / "database/data.sql"
        p.unlink()
        p.symlink_to("roles.sql")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_empty_database_export_rejected(self):
        (self.root / "database/data.sql").write_bytes(b"")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_duplicate_manifest_rejected(self):
        self.manifest["files"].append(self.manifest["files"][0])
        self.assertNotEqual(self.run_verifier(), 0)


if __name__ == "__main__":
    unittest.main()
