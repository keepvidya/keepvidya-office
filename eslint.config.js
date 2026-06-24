import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'prototype/**', 'coverage/**', '**/*.cjs', '**/*.config.*'] },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { parser: tsparser, ecmaVersion: 2021, sourceType: 'module' },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...(tseslint.configs?.recommended?.rules ?? {}),
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['exceljs', 'pptxgenjs', 'docx', '@univerjs/*', 'idb', 'zod'],
              message: 'Wrapper Rule: external modules may only be imported inside src/adapters/**',
            },
          ],
        },
      ],
    },
  },
  // adapters are the ONLY place a vendor type may appear
  { files: ['src/adapters/**/*.ts'], rules: { 'no-restricted-imports': 'off' } },
  // tests may import vendors to verify adapter output
  { files: ['tests/**/*.ts'], rules: { 'no-restricted-imports': 'off' } },
];
