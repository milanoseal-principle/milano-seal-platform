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

    def test_whitespace_or_control_characters_fail_without_secret_disclosure(self):
        # urlsplit silently drops tab/CR/LF, but psql receives the raw secret: a
        # trailing newline became sslmode="require\n" in run 43060264117.
        ref = "a" * 20
        valid = f"postgresql://postgres:synthetic-secret@db.{ref}.supabase.co:5432/postgres?sslmode=require"
        for url in (valid+"\n", valid+"\r\n", " "+valid, valid+" ", valid.replace("?","\n?"), valid.replace("@","\t@"), valid+"\x00"):
            with self.subTest(case=repr(url[-3:])):
                with self.assertRaises(RuntimeError) as error:
                    exporter.validate_database_url(url,ref)
                self.assertNotIn("synthetic-secret",str(error.exception))
                self.assertIn("whitespace or control characters",str(error.exception))


class DatabaseUrlDiagnosisTests(unittest.TestCase):
    REF = "a" * 20
    DIRECT = f"postgresql://postgres:synthetic-secret@db.{REF}.supabase.co:5432/postgres?sslmode=require"
    POOLER = f"postgresql://postgres.{REF}:synthetic-secret@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require"

    def failed(self, url):
        result = exporter.diagnose_database_url(url, self.REF)
        self.assertEqual(tuple(result), exporter.DATABASE_URL_CHECKS)
        self.assertTrue(all(isinstance(v, bool) for v in result.values()), "booleans only: nothing derived from the value")
        return {name for name, ok in result.items() if not ok}

    def test_valid_targets_pass_every_check(self):
        for url in (self.DIRECT, self.POOLER, self.DIRECT.replace(":5432", ""), self.POOLER.replace("postgresql:", "postgres:")):
            self.assertEqual(self.failed(url), set())

    def test_each_defect_is_named_by_its_own_check(self):
        cases = (
            (None, set(exporter.DATABASE_URL_CHECKS)),
            ("", set(exporter.DATABASE_URL_CHECKS)),
            (self.DIRECT.replace("?sslmode=require", ""), {"TLS"}),
            (self.DIRECT.replace("sslmode=require", "sslmode=disable"), {"TLS"}),
            (self.POOLER.replace(":5432", ":6543"), {"PORT"}),
            (self.POOLER.replace(f"postgres.{self.REF}", "postgres"), {"USERNAME"}),
            (self.POOLER.replace(self.REF, "b" * 20), {"USERNAME"}),
            (self.DIRECT.replace(self.REF, "b" * 20), {"HOST"}),
            (self.DIRECT.replace("/postgres?", "/postgres/postgres?"), {"DATABASE"}),
            (self.DIRECT.replace("/postgres?", "?"), {"DATABASE"}),
            (self.DIRECT.replace("postgresql:", "https:"), {"SCHEME"}),
            (self.DIRECT.replace(":synthetic-secret", ""), {"STRUCTURE"}),
            (self.DIRECT + "&host=wrong.invalid", {"STRUCTURE"}),
            (self.DIRECT + "#fragment", {"STRUCTURE"}),
            (self.DIRECT + "\n", {"URL_PARSING"}),
            (" " + self.DIRECT, {"URL_PARSING"}),
            ('"' + self.DIRECT + '"', {"SCHEME", "HOST", "USERNAME", "DATABASE", "TLS", "STRUCTURE"}),
        )
        for url, expected in cases:
            with self.subTest(expected=sorted(expected)):
                self.assertEqual(self.failed(url), expected)
        # A malformed port cannot be parsed at all: only PRESENT holds.
        self.assertEqual(self.failed(self.DIRECT.replace(":5432", ":invalid")), set(exporter.DATABASE_URL_CHECKS) - {"PRESENT"})

    def test_diagnosis_agrees_with_the_validator(self):
        urls = [self.DIRECT, self.POOLER, self.DIRECT.replace("?sslmode=require", ""), self.POOLER.replace(":5432", ":6543"),
                self.POOLER.replace(self.REF, "b" * 20), self.DIRECT + "\n", self.DIRECT.replace(":5432", ":invalid"),
                self.DIRECT + "&port=6543", "postgresql://synthetic-secret", '"' + self.DIRECT + '"']
        for url in urls:
            with self.subTest(url=urls.index(url)):
                try:
                    exporter.validate_database_url(url, self.REF)
                    accepted = True
                except RuntimeError:
                    accepted = False
                self.assertEqual(accepted, not self.failed(url))

    def test_command_prints_only_check_names_and_never_the_value(self):
        import subprocess
        script = HERE / "diagnose_database_url.py"
        for url, code in ((self.POOLER, 0), (self.POOLER.replace("?sslmode=require", ""), 1), ("\x00not a url", 1)):
            env = {"PATH": os.environ.get("PATH", ""), "SUPABASE_PROJECT_REF": self.REF}
            if "\x00" not in url:
                env["SUPABASE_DB_URL"] = url
            done = subprocess.run([sys.executable, str(script)], env=env, capture_output=True, text=True)
            self.assertEqual(done.returncode, code)
            self.assertEqual(done.stderr, "")
            lines = done.stdout.splitlines()
            self.assertEqual([l.split(": ")[0] for l in lines], list(exporter.DATABASE_URL_CHECKS))
            self.assertTrue(all(l.split(": ")[1] in ("PASS", "FAIL") for l in lines))
            for fragment in ("synthetic-secret", "pooler", "postgres.", self.REF, "5432"):
                self.assertNotIn(fragment, done.stdout)


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


BACKUP_WORKFLOW = HERE.parents[1] / ".github" / "workflows" / "independent-supabase-backup.yml"


# The scheduled backup workflow was removed from main (e5708a1a) and is deferred.
# This guard returns automatically if the workflow is restored.
@unittest.skipUnless(BACKUP_WORKFLOW.exists(), "backup workflow deferred: not present on this branch")
class WorkflowTests(unittest.TestCase):
    WORKFLOW = BACKUP_WORKFLOW

    def test_checksum_cmp_compares_exactly_two_files(self):
        # cmp's third/fourth operands are byte offsets; an extra path aborts the step.
        import shlex
        lines = [l.strip() for l in self.WORKFLOW.read_text().splitlines() if l.strip().startswith("cmp ")]
        self.assertTrue(lines, "workflow must compare local and remote checksums with cmp")
        for line in lines:
            self.assertEqual(len(shlex.split(line)[1:]), 2, line)

    def test_runs_only_on_main_by_manual_dispatch_and_diagnoses_before_export(self):
        text = self.WORKFLOW.read_text()
        self.assertIn("workflow_dispatch:", text)
        self.assertNotIn("pull_request", text)
        self.assertNotIn("schedule:", text, "no schedule until a backup and restore have been verified")
        self.assertIn("if: github.ref == 'refs/heads/main'", text)
        self.assertLess(text.index("scripts/backups/diagnose_database_url.py"), text.index("supabase db dump"))

    def test_database_errors_are_classified_without_printing_client_output(self):
        text = self.WORKFLOW.read_text()
        for marker in ("DATABASE_AUTH_FAILED", "DATABASE_CONNECTION_FAILED", "DATABASE_TLS_OR_VERSION_CHECK_FAILED"):
            self.assertIn(marker, text)
        self.assertNotIn("set -x", text)
        self.assertNotIn("cat \"$probe_err\"", text)


drill_spec = importlib.util.spec_from_file_location("restore_drill", HERE / "restore_drill.py")
drill = importlib.util.module_from_spec(drill_spec)
drill_spec.loader.exec_module(drill)
RESTORE_WORKFLOW = HERE.parents[1] / ".github" / "workflows" / "isolated-restore-drill.yml"


class RestoreDrillTests(unittest.TestCase):
    SCHEMA = (
        'CREATE TABLE IF NOT EXISTS "public"."deals" (\n    "id" uuid\n);\n'
        'CREATE TABLE IF NOT EXISTS "public"."files" (\n    "id" uuid\n);\n'
        'CREATE TABLE IF NOT EXISTS "storage"."objects" (\n    "id" uuid\n);\n'
    )
    DATA = (
        'COPY "public"."deals" ("id", "notes") FROM stdin;\n'
        "a\\tline with escaped\\nnewline\n"
        "b\t\\N\n"
        "\\.\n"
        'COPY "public"."files" ("id") FROM stdin;\n'
        "\\.\n"
    )

    def write(self, directory, name, text):
        path = Path(directory) / name
        path.write_text(text)
        return path

    def test_expected_counts_come_from_the_dump_itself(self):
        with tempfile.TemporaryDirectory() as d:
            schema = self.write(d, "schema.sql", self.SCHEMA)
            data = self.write(d, "data.sql", self.DATA)
            auth = self.write(d, "auth.sql", 'COPY auth.users (id) FROM stdin;\nu1\nu2\n\\.\n')
            out = Path(d) / "expected.json"
            with contextlib.redirect_stdout(io.StringIO()):
                drill.expected(out, schema, data, auth)
            spec = json.loads(out.read_text())
            self.assertEqual(spec["public_tables"], ["public.deals", "public.files"])
            self.assertEqual(spec["rows"], {"public.deals": 2, "public.files": 0, "auth.users": 2})

    def test_unterminated_copy_block_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            data = self.write(d, "data.sql", 'COPY "public"."deals" ("id") FROM stdin;\nrow\n')
            with self.assertRaises(SystemExit):
                drill.copy_counts(data)

    def test_compare_requires_every_table_and_exact_row_counts(self):
        with tempfile.TemporaryDirectory() as d:
            spec = self.write(d, "expected.json", json.dumps({"public_tables": ["public.deals", "public.files"],
                                                              "rows": {"public.deals": 2, "auth.users": 1}}))
            good = self.write(d, "good.tsv", "public.deals\t2\npublic.files\t0\nauth.users\t1\n")
            with contextlib.redirect_stdout(io.StringIO()):
                drill.compare(spec, good, Path(d) / "summary.json")
            summary = json.loads((Path(d) / "summary.json").read_text())
            self.assertEqual((summary["missing_tables"], summary["row_count_mismatches"]), (0, 0))
            for bad in ("public.deals\t1\npublic.files\t0\nauth.users\t1\n", "public.deals\t2\nauth.users\t1\n"):
                tsv = self.write(d, "bad.tsv", bad)
                with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(SystemExit):
                    drill.compare(spec, tsv, Path(d) / "summary.json")

    def test_count_sql_quotes_identifiers_and_covers_every_table(self):
        with tempfile.TemporaryDirectory() as d:
            spec = self.write(d, "expected.json", json.dumps({"public_tables": ["public.deals"], "rows": {'auth.we"ird': 0}}))
            out = Path(d) / "count.sql"
            drill.count_sql(spec, out)
            sql = out.read_text()
            self.assertIn('from "public"."deals"', sql)
            self.assertIn('from "auth"."we""ird"', sql)

    def test_storage_restore_refuses_any_non_local_target(self):
        with patch.dict(os.environ, {"RESTORE_TARGET_SERVICE_KEY": "local-only"}):
            for url in ("https://ehqdzfopsrbwewtddiwq.supabase.co", "http://10.0.0.5:54321"):
                with self.assertRaises(SystemExit):
                    drill.storage("/nonexistent", url)
        with patch.dict(os.environ, {"RESTORE_TARGET_SERVICE_KEY": ""}):
            with self.assertRaises(SystemExit):
                drill.storage("/nonexistent", "http://127.0.0.1:54321")

    def test_failure_output_is_classified_and_never_quotes_restored_values(self):
        leaked = ('ERROR:  new row for relation "deals" violates check constraint "deals_status_check"\n'
                  'DETAIL:  Failing row contains (11111111-aaaa, Jane Secret, jane@example.invalid, 555-0100).\n'
                  'CONTEXT:  COPY deals, line 7: "11111111-aaaa\tJane Secret\tjane@example.invalid"\n')
        with tempfile.TemporaryDirectory() as d:
            err = self.write(d, "restore.err", leaked)
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                drill.classify("database-restore", err)
            printed = out.getvalue()
        self.assertIn("class=CHECK_OR_NOT_NULL_VIOLATION", printed)
        for secret in ("Jane", "Secret", "jane@example.invalid", "555-0100", "11111111", "deals_status_check"):
            self.assertNotIn(secret, printed)
        self.assertEqual(drill.classify_text('duplicate key value violates unique constraint "x"'), "UNIQUE_VIOLATION")
        self.assertEqual(drill.classify_text("something unexpected"), "UNCLASSIFIED")

    def test_every_command_against_the_restored_database_keeps_diagnostics_out_of_the_log(self):
        text = RESTORE_WORKFLOW.read_text()
        # Each docker command that talks to the restored database must send stderr to the
        # protected drill directory and print only a classification on failure.
        blocks = [b for b in text.split("docker run --rm --network host")[1:] if "then\n" in b.split("fi\n", 1)[0]]
        self.assertEqual(len(blocks), 7)
        for block in blocks:
            command = block.split("then\n", 1)[0]
            self.assertRegex(command, r'2> "\$DRILL/[a-z-]+\.err"', command[:120])
            self.assertIn("restore_drill.py classify", block.split("fi\n", 1)[0])
        self.assertNotIn("2>&1", text)

    def test_failure_facts_name_class_sqlstate_and_location_but_never_values(self):
        with tempfile.TemporaryDirectory() as d:
            schema = self.write(d, "schema.sql", 'SET x = 1;\n\nALTER TABLE "public"."deals"\n    OWNER TO "supabase_admin";\n')
            self.write(d, "data.sql", "COPY public.deals (id, email) FROM stdin;\nsecret-row\tjane@example.invalid\n\\.\n")
            ownership = 'psql:/backup/schema.sql:4: ERROR:  42501: must be able to SET ROLE "supabase_admin"\nLOCATION: x.c:1\n'
            self.assertEqual(drill.diagnose(ownership, d), {"class": "ROLE_MEMBERSHIP_REQUIRED", "sqlstate": "42501",
                                                            "file": "schema.sql", "line": 4, "statement": "ALTER TABLE"})
            data_error = ('psql:/backup/data.sql:2: ERROR:  23514: new row violates check constraint "c"\n'
                          "DETAIL:  Failing row contains (secret-row, jane@example.invalid).\n")
            facts = drill.diagnose(data_error, d)
            self.assertEqual(facts, {"class": "CHECK_OR_NOT_NULL_VIOLATION", "sqlstate": "23514", "file": "data.sql", "line": 2,
                                     "relation": "public.deals", "relation_schema": "application", "defined_in_schema_dump": False})
            err = self.write(d, "e.err", data_error)
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                drill.classify("database-restore", err, d)
            for secret in ("secret-row", "jane@example.invalid", "Failing", '"c"'):
                self.assertNotIn(secret, out.getvalue())
        self.assertEqual(drill.classify_text("ERROR:  Non-superuser owned event trigger must execute a non-superuser owned function"), "SUPERUSER_REQUIRED")
        self.assertEqual(drill.classify_text("ERROR:  permission denied for parameter log_min_messages"), "PERMISSION_DENIED")
        self.assertEqual(drill.classify_text('ERROR:  extension "x" is not available'), "EXTENSION_UNAVAILABLE")
        # A file outside the allowlist is never named.
        self.assertNotIn("file", drill.diagnose("psql:/backup/customers.csv:9: ERROR:  syntax error at end of input"))

    # Drill #3 (2026-11-14): 42P01 at data.sql line 191125. The data dump carries rows for
    # Supabase-managed tables, and hosted Storage has tables a local stack lacks
    # (storage.bucket_lifecycle_states, storage.lifecycle_abandoned_artifacts).
    HOSTED_DATA = (
        "SET session_replication_role = replica;\n\n-- \\restrict k\n\nSET statement_timeout = 0;\n"
        "SELECT pg_catalog.set_config('search_path', '', false);\n\n"
        "--\n-- Data for Name: users; Type: TABLE DATA; Schema: auth\n--\n\n"
        'COPY "auth"."users" ("id", "email") FROM stdin;\nu1\tjane@example.invalid\n\\.\n\n'
        'COPY "auth"."identities" ("id", "user_id") FROM stdin;\ni1\tu1\n\\.\n\n'
        'COPY "public"."deals" ("id", "client_name") FROM stdin;\nd1\tJane Secret\nd2\t\\N\n\\.\n\n'
        'COPY "storage"."bucket_lifecycle_states" ("bucket_id", "state") FROM stdin;\n\\.\n\n'
        'COPY "storage"."buckets" ("id", "name") FROM stdin;\ndocuments\tdocuments\n\\.\n\n'
        'COPY "storage"."objects" ("id", "bucket_id", "name") FROM stdin;\no1\tdocuments\tmatter/secret.pdf\n\\.\n\n'
        "SELECT pg_catalog.setval('\"auth\".\"refresh_tokens_id_seq\"', 5, true);\n"
        "SELECT pg_catalog.setval('\"public\".\"deals_seq\"', 2, true);\n\n"
        "-- \\unrestrict k\n\nRESET ALL;\n"
    )
    LOCAL_CATALOG = "".join("C\t%s\t%s\n" % (t, c) for t, cols in {
        "auth.users": ("id", "email", "phone"), "auth.identities": ("id", "user_id"),
        "storage.buckets": ("id", "name"), "storage.objects": ("id", "bucket_id", "name")}.items() for c in cols) + "S\tauth.refresh_tokens_id_seq\t\n"

    def split(self, d, data=None):
        data_sql = self.write(d, "data.sql", data or self.HOSTED_DATA)
        with contextlib.redirect_stdout(io.StringIO()):
            drill.split_data(data_sql, Path(d) / "split")
        return Path(d) / "split"

    def managed(self, split, catalog):
        tsv = self.write(split, "target_catalog.tsv", catalog)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            drill.managed_sql(split, tsv, split / "managed_restore.sql", split / "report.json")
        return out.getvalue()

    def test_data_dump_splits_into_strict_application_data_and_per_table_managed_blocks(self):
        with tempfile.TemporaryDirectory() as d:
            split = self.split(d)
            app = (split / "app.sql").read_text()
            self.assertTrue(app.startswith("SET session_replication_role = replica;\nSET statement_timeout = 0;"))
            self.assertIn('COPY "public"."deals"', app)
            self.assertIn("d2\t\\N\n\\.\n", app, "application rows are kept byte for byte")
            self.assertIn("deals_seq", app)
            self.assertTrue(app.endswith("RESET ALL;\n"))
            for managed in ('"auth"', '"storage"', "refresh_tokens_id_seq"):
                self.assertNotIn(managed, app)
            self.assertEqual(drill.copy_counts(split / "app.sql"), {"public.deals": 2})
            spec = json.loads((split / "managed.json").read_text())
            self.assertEqual([(b["table"], b["rows"]) for b in spec["blocks"]],
                             [("auth.users", 1), ("auth.identities", 1), ("storage.bucket_lifecycle_states", 0),
                              ("storage.buckets", 1), ("storage.objects", 1)])
            self.assertNotIn("jane@example.invalid", (split / "managed.json").read_text(), "the index holds names and counts only")
            # Anything other than data between COPY blocks fails closed instead of being dropped.
            bad = self.HOSTED_DATA.replace("RESET ALL;", "DELETE FROM public.deals;\nRESET ALL;")
            with self.assertRaises(SystemExit):
                self.split(d, bad)

    def test_managed_tables_restore_only_into_compatible_target_tables_and_gaps_are_reported(self):
        with tempfile.TemporaryDirectory() as d:
            split = self.split(d)
            printed = self.managed(split, self.LOCAL_CATALOG)
            report = json.loads((split / "report.json").read_text())
            self.assertEqual(report["managed_tables_restored"], {"auth.users": 1, "auth.identities": 1, "storage.buckets": 1, "storage.objects": 1})
            self.assertEqual(report["managed_tables_not_restorable"],
                             [{"table": "storage.bucket_lifecycle_states", "rows": 0, "reason": "TABLE_NOT_IN_TARGET"}])
            self.assertEqual(report["managed_rows_not_restorable"], 0)
            sql = (split / "managed_restore.sql").read_text()
            self.assertNotIn("bucket_lifecycle_states", sql)
            self.assertIn("refresh_tokens_id_seq", sql)
            self.assertIn("SET session_replication_role = replica;", sql)
            # The restored managed rows are what fidelity expects; nothing else is counted.
            self.assertEqual(drill.copy_counts(split / "managed_restore.sql"), report["managed_tables_restored"])
            for secret in ("jane@example.invalid", "secret.pdf", "Jane"):
                self.assertNotIn(secret, printed)

    def test_archived_managed_rows_are_never_left_behind_silently(self):
        with tempfile.TemporaryDirectory() as d:
            rows = self.HOSTED_DATA.replace('"state") FROM stdin;\n', '"state") FROM stdin;\ndocuments\tactive\n')
            split = self.split(d, rows)
            with self.assertRaises(SystemExit) as failed:
                self.managed(split, self.LOCAL_CATALOG)
            self.assertEqual(str(failed.exception), "MANAGED_ROWS_NOT_RESTORABLE")
            # A dumped column the target lacks is a gap too, reported by column name.
            split = self.split(d, self.HOSTED_DATA.replace('"auth"."identities" ("id", "user_id")', '"auth"."identities" ("id", "user_id", "provider_id")'))
            with self.assertRaises(SystemExit) as failed:
                self.managed(split, self.LOCAL_CATALOG)
            self.assertEqual(str(failed.exception), "REQUIRED_MANAGED_TABLE_NOT_RESTORABLE")
            report = json.loads((split / "report.json").read_text())
            self.assertIn({"table": "auth.identities", "rows": 1, "reason": "COLUMNS_NOT_IN_TARGET", "columns": ["provider_id"]},
                          report["managed_tables_not_restorable"])
            # Sign-in records and Storage metadata are required, even when the dump lacks them.
            split = self.split(d, self.HOSTED_DATA.replace('COPY "storage"."objects"', 'COPY "storage"."objects_renamed"'))
            with self.assertRaises(SystemExit):
                self.managed(split, self.LOCAL_CATALOG + "C\tstorage.objects_renamed\tid\n")
            self.assertEqual(json.loads((split / "report.json").read_text())["required_managed_failures"], ["storage.objects"])

    def test_missing_relation_is_named_with_its_schema_class_and_archive_definition(self):
        with tempfile.TemporaryDirectory() as d:
            self.write(d, "schema.sql", 'CREATE TABLE IF NOT EXISTS "public"."deals" (\n    "id" uuid\n);\n')
            self.write(d, "data.sql", self.HOSTED_DATA)
            line = self.HOSTED_DATA.splitlines().index('COPY "storage"."bucket_lifecycle_states" ("bucket_id", "state") FROM stdin;') + 1
            err = ('psql:/backup/data.sql:%d: ERROR:  42P01: relation "storage.bucket_lifecycle_states" does not exist\n'
                   "LOCATION:  parserOpenTable, parse_relation.c:1452\n" % line)
            self.assertEqual(drill.diagnose(err, d), {"class": "MISSING_OBJECT", "sqlstate": "42P01", "file": "data.sql", "line": line,
                                                      "relation": "storage.bucket_lifecycle_states", "relation_schema": "managed",
                                                      "defined_in_schema_dump": False})
            row_line = self.HOSTED_DATA.splitlines().index("d1\tJane Secret") + 1
            facts = drill.diagnose("psql:/split/data.sql:%d: ERROR:  22P02: invalid input syntax\n" % row_line, d)
            self.assertEqual((facts["relation"], facts["relation_schema"]), ("public.deals", "application"))
            self.assertTrue(facts["defined_in_schema_dump"])
            setval_line = self.HOSTED_DATA.splitlines().index("SELECT pg_catalog.setval('\"auth\".\"refresh_tokens_id_seq\"', 5, true);") + 1
            self.assertEqual(drill.diagnose("psql:data.sql:%d: ERROR:  42P01: x\n" % setval_line, d)["relation"], "auth.refresh_tokens_id_seq")

    def test_restore_loads_application_data_strictly_and_managed_data_once(self):
        text = RESTORE_WORKFLOW.read_text()
        self.assertIn("restore_drill.py split-data", text)
        self.assertIn("--file /split/app.sql", text)
        self.assertNotIn("--file /backup/data.sql", text)
        self.assertIn("restore_drill.py managed-sql", text)
        self.assertIn("--single-transaction -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -q --file /split/managed_restore.sql", text)
        # data.sql already carries auth.users and auth.identities: a second load from the custom
        # dump would duplicate them (23505), so it is gone.
        self.assertNotIn("pg_restore", text)
        self.assertIn('"$DRILL/split/app.sql" "$DRILL/split/managed_restore.sql"', text)
        self.assertIn('"managed_tables": json.loads((drill / "managed.json").read_text())', text)

    def test_migration_rehearsal_is_opt_in_after_recovery_evidence_and_only_on_the_restored_copy(self):
        text = RESTORE_WORKFLOW.read_text()
        self.assertIn("rehearse_production_migrations:", text)
        self.assertIn("default: false", text.split("rehearse_production_migrations:", 1)[1].split("permissions:", 1)[0])
        rehearsal = text.split("- name: Rehearse the pending production migrations", 1)[1].split("- name:", 1)[0]
        self.assertIn("if: inputs.rehearse_production_migrations", rehearsal)
        # Recovery is verified (and its end time recorded) on the unmodified restore first.
        self.assertLess(text.index("RESTORE_END="), text.index("- name: Rehearse the pending production migrations"))
        self.assertIn('--command "SET ROLE postgres" --file "/migrations/$FILE"', rehearsal)
        self.assertIn('-v "$GITHUB_WORKSPACE/supabase/migrations:/migrations:ro"', rehearsal)
        self.assertIn("migration_rehearsal_checks.sql", rehearsal)
        self.assertNotIn("supabase db push", text)
        self.assertNotIn("schema_migrations", rehearsal, "the rehearsal never writes a migration ledger")
        # A failing migration is named with its line and statement keywords, never message text.
        with tempfile.TemporaryDirectory() as d:
            self.write(d, "20261114100000_founder_admin_server_identity.sql", "create or replace function public.f()\nreturns int language sql as $$ select 1 $$;\n")
            facts = drill.diagnose('psql:/migrations/20261114100000_founder_admin_server_identity.sql:2: ERROR:  42501: must be owner of function f\n', d)
            self.assertEqual(facts, {"class": "PERMISSION_DENIED", "sqlstate": "42501", "file": "20261114100000_founder_admin_server_identity.sql",
                                     "line": 2, "statement": "CREATE OR REPLACE FUNCTION"})
            self.assertNotIn("file", drill.diagnose("psql:/migrations/../customers.sql:2: ERROR:  42501: x\n", d))

    def test_restore_runs_as_the_local_targets_own_superuser_only(self):
        text = RESTORE_WORKFLOW.read_text()
        self.assertIn("postgresql://supabase_admin:*@127.0.0.1:*", text)
        self.assertIn("select rolsuper from pg_roles where rolname = current_user", text)
        database_steps = [b for b in text.split("docker run --rm --network host")[1:] if "then\n" in b.split("fi\n", 1)[0]]
        for block in database_steps:
            self.assertIn('-e DB_URL="$RESTORE_DB_URL"', block.split("\n", 1)[0])
        self.assertNotIn("ON_ERROR_STOP=0", text)

    def test_restore_workflow_cannot_reach_production(self):
        text = RESTORE_WORKFLOW.read_text()
        self.assertIn("workflow_dispatch:", text)
        self.assertNotIn("schedule:", text)
        self.assertNotIn("pull_request", text)
        self.assertIn("if: github.ref == 'refs/heads/main'", text)
        for production_binding in ("BACKUP_SUPABASE_DB_URL", "BACKUP_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL:", "supabase.co"):
            self.assertNotIn(production_binding, text)
        self.assertIn('[[ "$DB_URL" == postgresql://*@127.0.0.1:* ]]', text)
        self.assertNotIn("set -x", text)
        # Decrypted material and the target are always destroyed.
        self.assertIn("if: always()", text)
        self.assertIn("supabase stop --no-backup", text)


if __name__ == "__main__":
    unittest.main()
