import js from '@eslint/js';
import hooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: ['dist/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        sessionStorage: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        TextEncoder: 'readonly',
        Uint8Array: 'readonly',
        devicePixelRatio: 'readonly',
        innerWidth: 'readonly',
        innerHeight: 'readonly',
        AbortController: 'readonly',
        IntersectionObserver: 'readonly',
        getComputedStyle: 'readonly',
        performance: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { 'react-hooks': hooks, react },
    rules: {
      ...hooks.configs.recommended.rules,
      // 让 no-unused-vars 认出 JSX 里用到的组件导入
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
