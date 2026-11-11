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
import tarfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("export_storage", HERE / "export_storage.py")
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def obj(name="file.pdf", version="one", size=3):
    return {"name": name, "id": "synthetic-object", "updated_at": version,
            "metadata": {"eTag": version, "size": size}}


class DatabaseTargetTests(unittest.TestCase):
    def test_exact_direct_and_session_pool_targets_with_tls(self):
        ref = "a" * 20
        for host, user in ((f"db.{ref}.supabase.co", "postgres"), ("aws-0-region.pooler.supabase.com", f"postgres.{ref}")):
            exporter.validate_database_url(f"postgresql://{user}:synthetic-password@{host}:5432/postgres?sslmode=require",ref)

    def test_wrong_target_pooler_and_tls_fail_without_secret_disclosure(self):
        ref = "a" * 20
        valid = f"postgresql://postgres:synthetic-secret@db.{ref}.supabase.co:5432/postgres?sslmode=require"
        for url in (valid.replace(ref,"b"*20),valid.replace(":5432",":6543"),valid.replace("sslmode=require","sslmode=disable"),valid.replace("?sslmode=require",""),valid+"&sslmode=disable",valid+"&host=wrong.invalid",valid.replace(":5432",":invalid"),valid.replace("postgresql:","http:"),valid.replace("/postgres?","/other?"),"postgresql://synthetic-secret"):
            with self.subTest(case="invalid target"):
                with self.assertRaises(RuntimeError) as error:
                    exporter.validate_database_url(url,ref)
                self.assertNotIn("synthetic-secret",str(error.exception))


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.counts = self.root / "counts.tsv"
        self.counts.write_text("documents\t1\n")
        (self.root / "database").mkdir()
        for name in ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump"):
            (self.root / "database" / name).write_bytes(b"PGDMPsynthetic export" if name.endswith(".dump") else b"synthetic export")
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


    def test_missing_size_fails_without_manifest(self):
        with self.assertRaisesRegex(RuntimeError, "revision unavailable"):
            self.perform(self.api(lambda b, c, rows: [obj(size=None)] if rows else rows))
        self.assertFalse((self.out / "manifest.json").exists())

    def test_malformed_revision_fields_fail(self):
        for change in ({"id": []}, {"updated_at": {}}, {"metadata": {"size": True}}, {"metadata": {"size": -1}}):
            with self.subTest(change=change), self.assertRaises(RuntimeError):
                self.perform(self.api(lambda b, c, rows: [dict(obj(), **change)] if rows else rows))
        self.assertFalse((self.out / "manifest.json").exists())

    def test_missing_id_is_not_silently_treated_as_folder(self):
        with patch.object(exporter, "request", return_value=io.BytesIO(b'[{"name":"file.pdf","metadata":{"size":3}}]')):
            with self.assertRaisesRegex(RuntimeError, "revision unavailable"):
                exporter.inventory("https://example.invalid", "documents")

    def test_download_api_error_has_no_manifest(self):
        normal = self.api()
        def fake(url, payload=None):
            if payload is None:
                raise OSError("download denied")
            return normal(url, payload)
        with self.assertRaises(OSError):
            self.perform(fake)
        self.assertFalse((self.out / "manifest.json").exists())

    def test_interrupted_download_has_no_manifest(self):
        class Interrupted(io.BytesIO):
            def read(self, size=-1):
                if self.tell():
                    raise OSError("connection interrupted")
                return super().read(1)
        normal = self.api()
        with self.assertRaises(OSError):
            self.perform(lambda url, payload=None: Interrupted(b"pdf") if payload is None else normal(url, payload))
        self.assertFalse((self.out / "manifest.json").exists())

    def test_failed_manifest_write_leaves_no_success_marker(self):
        with patch.object(exporter.json, "dump", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                self.perform(self.api())
        self.assertFalse((self.out / "manifest.json").exists())
        self.assertEqual(list(self.out.glob(".manifest-*")), [])

    def test_database_changed_during_storage_export_fails(self):
        normal = self.api()
        def fake(url, payload=None):
            if payload is None:
                (self.root / "database/data.sql").write_bytes(b"changed")
            return normal(url, payload)
        with self.assertRaisesRegex(RuntimeError, "Database exports changed"):
            self.perform(fake)
        self.assertFalse((self.out / "manifest.json").exists())

    def test_export_root_symlink_is_rejected(self):
        real = self.root / "real-storage"
        real.mkdir()
        self.out.symlink_to(real, target_is_directory=True)
        with self.assertRaisesRegex(RuntimeError, "Symlink"):
            self.perform(self.api())

    def test_empty_object_is_exported_and_hashed(self):
        normal = self.api(lambda b, c, rows: [obj(size=0)] if rows else rows)
        self.perform(lambda url, payload=None: io.BytesIO(b"") if payload is None else normal(url, payload))
        record = json.loads((self.out / "manifest.json").read_text())["files"][0]
        self.assertEqual(record["bytes"], 0)
        self.assertEqual(record["sha256"], hashlib.sha256(b"").hexdigest())


class VerifierTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "storage/documents").mkdir(parents=True)
        (self.root / "database").mkdir()
        for name in ("roles.sql", "schema.sql", "data.sql", "auth-storage-data.dump"):
            (self.root / "database" / name).write_bytes(b"PGDMPsynthetic export" if name.endswith(".dump") else b"synthetic export")
        (self.root / "storage/documents/file.pdf").write_bytes(b"pdf")
        self.manifest = {"format_version": 2, "project_ref": "a" * 20, "database": exporter.database_inventory(self.root / "database"), "counts": {"documents": 1, "evidence": 0, "deal-documents": 0}, "files": [
            {"bucket": "documents", "path": "file.pdf", "bytes": 3, "sha256": hashlib.sha256(b"pdf").hexdigest(), "revision": {"id":"fixture", "updated_at":"one", "size":3, "etag":"one"}}]}

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


    def test_corrupt_database_export_rejected(self):
        (self.root / "database/data.sql").write_bytes(b"altered data")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_corrupt_custom_dump_header_rejected(self):
        (self.root / "database/auth-storage-data.dump").write_bytes(b"broken")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_backup_root_symlink_rejected_before_resolution(self):
        self.run_verifier()
        alias = self.root / "root-link"
        alias.symlink_to(self.root, target_is_directory=True)
        result = subprocess.run([sys.executable, str(HERE / "verify_backup.py"), str(alias)], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Symlink in backup root", result.stderr)

    def test_unlisted_storage_file_rejected(self):
        (self.root / "storage/documents/unlisted.pdf").write_bytes(b"unlisted")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_unlisted_root_content_rejected(self):
        (self.root / "unexpected").write_bytes(b"unlisted")
        self.assertNotEqual(self.run_verifier(), 0)

    def test_unlisted_storage_symlink_rejected(self):
        (self.root / "storage/unlisted").symlink_to("documents", target_is_directory=True)
        self.assertNotEqual(self.run_verifier(), 0)

    def test_corrupt_manifest_shapes_rejected(self):
        for field, value in (("counts", []), ("files", {}), ("counts", {"documents": True,"evidence":0,"deal-documents":0}), ("database", {}), ("project_ref", "wrong")):
            old = self.manifest[field]
            self.manifest[field] = value
            with self.subTest(field=field, value=value):
                self.assertNotEqual(self.run_verifier(), 0)
            self.manifest[field] = old

    def test_missing_revision_rejected(self):
        del self.manifest["files"][0]["revision"]
        self.assertNotEqual(self.run_verifier(), 0)

    def test_manifest_control_character_path_rejected(self):
        path = self.root / "storage/documents/file.pdf"
        path.rename(path.with_name("file\n.pdf"))
        self.manifest["files"][0]["path"] = "file\n.pdf"
        self.assertNotEqual(self.run_verifier(), 0)

    def test_malformed_json_rejected(self):
        (self.root / "storage/manifest.json").write_text("{broken")
        self.assertNotEqual(subprocess.run([sys.executable,str(HERE / "verify_backup.py"),str(self.root)],capture_output=True).returncode, 0)


class ArchiveTests(unittest.TestCase):
    def inspect(self, extra=None):
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "backup.tar"
            with tarfile.open(archive, "w") as output:
                for name in ("./storage/manifest.json", "./database/roles.sql", "./database/schema.sql", "./database/data.sql", "./database/auth-storage-data.dump"):
                    record = tarfile.TarInfo(name)
                    record.size = 1
                    output.addfile(record, io.BytesIO(b"x"))
                if extra is not None:
                    output.addfile(extra, io.BytesIO(b"x") if extra.isfile() else None)
            return subprocess.run([sys.executable,str(HERE / "verify_backup.py"),"--archive",str(archive)],capture_output=True,text=True).returncode

    def test_expected_tar_paths_pass_without_extraction(self):
        self.assertEqual(self.inspect(), 0)

    def test_tar_traversal_and_absolute_paths_rejected(self):
        for name in ("../escape", "/tmp/escape", "storage/../escape"):
            entry = tarfile.TarInfo(name)
            entry.size = 1
            self.assertNotEqual(self.inspect(entry), 0)

    def test_tar_links_and_special_types_rejected(self):
        for kind in (tarfile.SYMTYPE,tarfile.LNKTYPE,tarfile.FIFOTYPE,tarfile.CHRTYPE):
            entry = tarfile.TarInfo("storage/link")
            entry.type = kind
            if kind in (tarfile.SYMTYPE,tarfile.LNKTYPE):
                entry.linkname = "../../outside"
            self.assertNotEqual(self.inspect(entry), 0)

    def test_tar_duplicate_normalized_path_rejected(self):
        entry = tarfile.TarInfo("storage/manifest.json")
        entry.size = 1
        self.assertNotEqual(self.inspect(entry), 0)


class WorkflowTests(unittest.TestCase):
    WORKFLOW = HERE.parents[1] / ".github" / "workflows" / "independent-supabase-backup.yml"

    def test_checksum_cmp_compares_exactly_two_files(self):
        # cmp's third/fourth operands are byte offsets; an extra path aborts the step.
        import shlex
        lines = [l.strip() for l in self.WORKFLOW.read_text().splitlines() if l.strip().startswith("cmp ")]
        self.assertTrue(lines, "workflow must compare local and remote checksums with cmp")
        for line in lines:
            self.assertEqual(len(shlex.split(line)[1:]), 2, line)


if __name__ == "__main__":
    unittest.main()
