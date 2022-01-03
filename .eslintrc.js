module.exports = {
  root: true,
  ...require('fabscale-eslint-config/lib/ember'),

  overrides: [
    // .ts files
    {
      parser: '@typescript-eslint/parser',
      files: ['**/*.ts'],
      ...require('fabscale-eslint-config/lib/ember-ts'),
    },

    // node files
    {
      files: [
        './*.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      ...require('fabscale-eslint-config/lib/node'),
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      ...require('fabscale-eslint-config/lib/ember-tests'),
    },
  ],
};
