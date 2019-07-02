module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['ember'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended'
  ],
  env: {
    browser: true
  },
  rules: {
    'prefer-destructuring': [
      'error',
      {
        array: false,
        object: true
      }
    ],
    'ember/no-deeply-nested-dependent-keys-with-each': 2
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js'
      ],
      excludedFiles: [
        'addon/**',
        'addon-test-support/**',
        'app/**',
        'tests/dummy/app/**'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2018
      },
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: ['tests/**/*.js'],
      rules: {
        'ember/avoid-leaking-state-in-ember-objects': 'off'
      }
    }
  ]
};
