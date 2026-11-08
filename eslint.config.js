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
