import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Linting for the React code.
 *
 * `npm run lint` was only ever `tsc --noEmit`, which type-checks but cannot see a React
 * mistake. That gap let the same defect ship in three separate screens: sub-components
 * declared inside a parent component, which React treats as a new type on every render and
 * therefore rebuilds the DOM instead of updating it. The rule that catches it,
 * react/no-unstable-nested-components, is switched on below and is an error rather than a
 * warning, because it produced a visibly broken UI rather than untidy code.
 */
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'dev-dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // The rule that would have caught the flicker. A component declared during render is a
      // new type each time, so React discards the subtree rather than updating it.
      'react/no-unstable-nested-components': ['error', { allowAsProps: false }],

      // Stale closures in effects are the other silent class of React bug: an effect that
      // captures an old value and quietly stops reflecting reality.
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/immutability': 'error',

      // Every data-fetching effect in this codebase sets a loading flag before awaiting, which
      // this rule counts as a synchronous setState. It costs one extra render and is the normal
      // pattern; treating it as an error would mean rewriting every screen's fetching around a
      // query library. Left visible as a warning so the debt is recorded rather than hidden.
      'react-hooks/set-state-in-effect': 'warn',

      // This codebase uses the automatic JSX runtime and TypeScript for prop types.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Deliberate escape hatches where an API shape is genuinely dynamic.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_', varsIgnorePattern: '^_',
      }],
    },
  },
);
