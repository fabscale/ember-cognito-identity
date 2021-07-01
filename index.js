'use strict';

module.exports = {
  name: require('./package').name,

  options: {
    autoImport: {
      exclude: [],
    },

    '@embroider/macros': {
      setOwnConfig: {
        enableMocks: process.env.MOCK_COGNITO !== 'false',
        mockUsername: 'jane@example.com',
        mockPassword: 'test1234',
        mockCode: 123456,
        mockJwtToken: 'TEST-ACCESS-TOKEN-AUTO',
      },
    },
  },

  included() {
    // If tests are not running, make sure pretender is not included
    let app = this._findHost();
    if (!app.tests) {
      this.options.autoImport.exclude.push('pretender');
    }

    this._super.included.apply(this, arguments);
  },
};
