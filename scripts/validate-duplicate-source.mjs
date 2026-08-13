// Merge-corruption gate for source declarations, test cases, and repeated bodies.
// The scanner is intentionally structural: formatting and comments cannot hide a
// duplicated block, while short/common implementation fragments are ignored.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const SOURCE_RE = /\.(?:[cm]?[jt]sx?)$/;
const MIN_BODY_CHARACTERS = 180;

function compact(node, sourceFile) {
  return node.getText(sourceFile).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "").replace(/\s+/g, "");
}

function declarationName(node) {
  if (!node.name || !ts.isIdentifier(node.name)) return null;
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)) return node.name.text;
  return null;
}

export function inspectSource(fileName, source) {
  const findings = [];
  const kind = fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const lines = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  for (const diagnostic of sf.parseDiagnostics) {
    const line = sf.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
    findings.push({ file: fileName, line, rule: "invalid-source", message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " ") });
  }

  const declarations = new Map();
  let defaultExports = 0;
  for (const statement of sf.statements) {
    const name = declarationName(statement);
    if (name) {
      if (declarations.has(name)) findings.push({ file: fileName, line: lines(statement), rule: "duplicate-declaration", message: `\`${name}\` was already declared on line ${declarations.get(name)}` });
      else declarations.set(name, lines(statement));
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const variableName = declaration.name.text;
        if (declarations.has(variableName)) findings.push({ file: fileName, line: lines(declaration), rule: "duplicate-declaration", message: `\`${variableName}\` was already declared on line ${declarations.get(variableName)}` });
        else declarations.set(variableName, lines(declaration));
      }
    }
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) ?? [] : [];
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) defaultExports += 1;
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) defaultExports += 1;
  }
  if (defaultExports > 1) findings.push({ file: fileName, line: 1, rule: "duplicate-default-export", message: `found ${defaultExports} default exports` });

  const bodies = new Map();
  const testNames = new Map();
  function visit(node, suite = "") {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        ["describe", "test", "it"].includes(node.expression.text) &&
        node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
      const label = node.arguments[0].text;
      const key = `${suite}\u0000${node.expression.text === "describe" ? "describe" : "test"}\u0000${label}`;
      if (testNames.has(key)) findings.push({ file: fileName, line: lines(node), rule: "duplicate-test", message: `\`${label}\` repeats line ${testNames.get(key)}` });
      else testNames.set(key, lines(node));
      if (node.expression.text === "describe") suite = `${suite}/${label}`;
    }

    // Inline map/filter callbacks commonly share renderers by design. Restrict
    // body fingerprints to named implementation units (including `const Foo =
    // () => ...`) so the gate catches concatenated features without flagging
    // deliberate small UI render callbacks.
    const namedArrow = ts.isArrowFunction(node) && ts.isVariableDeclaration(node.parent) &&
      ts.isIdentifier(node.parent.name);
    const body = (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || namedArrow)
      ? node.body
      : null;
    if (body) {
      const fingerprint = compact(body, sf);
      if (fingerprint.length >= MIN_BODY_CHARACTERS) {
        if (bodies.has(fingerprint)) findings.push({ file: fileName, line: lines(node), rule: "duplicate-body", message: `implementation repeats line ${bodies.get(fingerprint)}` });
        else bodies.set(fingerprint, lines(node));
      }
    }
    ts.forEachChild(node, (child) => visit(child, suite));
  }
  visit(sf);
  return findings;
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0").filter((file) => SOURCE_RE.test(file) && !file.endsWith(".d.ts"));
}

export function inspectFiles(files = trackedFiles()) {
  return files.flatMap((file) => inspectSource(file, readFileSync(file, "utf8")));
}

function main() {
  const files = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const findings = inspectFiles(files.length ? files.map((file) => path.normalize(file)) : undefined);
  if (findings.length) {
    console.error("Duplicate-source gate failed:");
    for (const item of findings) console.error(`  ${item.file}:${item.line} [${item.rule}] ${item.message}`);
    process.exitCode = 1;
  } else {
    console.log(`Duplicate-source gate passed (${files.length || trackedFiles().length} source files inspected).`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
