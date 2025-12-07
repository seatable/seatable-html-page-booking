import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: ['dist', 'node_modules', 'src/setting.local.*', 'src/locales/lang/**/*'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    ignores: [
      '/src/setting.js',
      '/src/setting.local.dist.js',
      '/src/setting.local.js',
    ],
    rules: {
      // 继承推荐规则
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'no-console': 'off',
      'no-cond-assign': 'off',
      'no-var': 'off',
      'no-case-declarations': 'off',
      'no-redeclare': 'off',
      indent: ['warn', 2, { SwitchCase: 1, ignoreComments: false }],
      'linebreak-style': ['warn', 'unix'],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],
      'no-unreachable': 'warn',
      'no-class-assign': 'warn',
      'no-unused-vars': 'warn',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'warn',
      'no-trailing-spaces': 'warn',
      'react/jsx-indent': ['warn', 2],
      'eol-last': 'error',
      'space-before-function-paren': ['warn', { named: 'never' }],
      'array-bracket-spacing': ['warn', 'never'],
      'object-curly-spacing': ['warn', 'always'],
      'spaced-comment': 'warn',
      'keyword-spacing': ['warn', { before: true }],
      'space-infix-ops': 'error',
      'key-spacing': ['error', { beforeColon: false }],
      'arrow-spacing': ['error', { before: true, after: true }],
      'comma-spacing': ['error', { before: false, after: true }],
      'one-var': ['error', 'never'],
      'brace-style': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-multi-spaces': 'warn',
      'no-duplicate-imports': 'warn',
      'react/jsx-closing-tag-location': 'error',
    },
  },
];
