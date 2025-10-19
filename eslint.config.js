import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'coverage/**']
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.renderer.json'],
        sourceType: 'module'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
