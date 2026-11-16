import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'ios', 'node_modules', 'planning', 'comms', 'harness', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: '18' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/audio', '**/audio/*', '**/audio/**'], message: 'core must not import from audio.' },
            { group: ['**/ui', '**/ui/*', '**/ui/**'], message: 'core must not import from ui.' },
            { group: ['**/storage', '**/storage/*', '**/storage/**'], message: 'core must not import from storage.' },
            { group: ['**/content', '**/content/*', '**/content/**'], message: 'core must not import from content.' },
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'], message: 'core must not import React.' },
          ],
        },
      ],
    },
  },
);
