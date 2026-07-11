import { FlatCompat } from '@eslint/eslintrc';
import { globalIgnores } from 'eslint/config';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-unused-vars': 'warn' } },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
];
export default config;
