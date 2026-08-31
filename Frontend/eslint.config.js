import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                // Loaded from the Chart.js CDN <script> tag in index.html, not an npm import.
                Chart: 'readonly',
            },
        },
    },
    prettierConfig,
    {
        ignores: ['dist/', 'node_modules/'],
    },
];
