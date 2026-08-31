const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            sourceType: 'commonjs',
            ecmaVersion: 2022,
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', args: 'after-used' }],
        },
    },
    prettierConfig,
    {
        ignores: ['node_modules/', 'uploads/'],
    },
];
