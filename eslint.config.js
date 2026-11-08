import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

// Correctness-only gate: every rule here is an error and the repository must pass it.
// Style rules are deliberately excluded; widen the set only after the codebase passes it.
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "public/**",
      "test_reports/**",
      "deployer-agent-docs/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tseslint.plugin, "react-hooks": reactHooks, "@next/next": nextPlugin },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "no-debugger": "error",
      "no-dupe-keys": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-self-assign": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unreachable": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": ["error", "except-parens"],
      "no-constant-binary-expression": "error",
      "no-sparse-arrays": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-empty-character-class": "error",
      "no-invalid-regexp": "error",
      "no-loss-of-precision": "error",
      "no-new-native-nonconstructor": "error",
      "no-setter-return": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "for-direction": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
);
import nextPlugin from '@next/eslint-plugin-next';
import hooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**', 'next-env.d.ts'] },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}', 'middleware.ts'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
    plugins: { '@typescript-eslint': tseslint.plugin, '@next/next': nextPlugin, 'react-hooks': hooksPlugin },
    rules: { 'no-debugger': 'error', 'no-constant-condition': 'error', 'no-unsafe-finally': 'error', 'no-sparse-arrays': 'error', '@typescript-eslint/no-duplicate-enum-values': 'error' },
  },
  { files: ['scripts/**/*.{js,mjs}', '*.{js,mjs}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' }, rules: { 'no-debugger': 'error', 'no-unsafe-finally': 'error' } },
];
