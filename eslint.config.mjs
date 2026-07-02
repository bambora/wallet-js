import tsEslintPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import compat from 'eslint-plugin-compat'
import importX from 'eslint-plugin-import-x'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts', '*.ts', '*.mjs'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      'import-x': importX,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      compat,
    },
    rules: {
      'compat/compat': 'error',
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      'compat/compat': 'off',
    },
  },
]
