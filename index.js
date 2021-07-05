'use strict';

module.exports = {
  name: require('./package').name,

  options: {
    autoImport: {
      exclude: [],
    },

    '@embroider/macros': {
      setOwnConfig: {
        enableMocks: Boolean(process.env.MOCK_COGNITO),
        mockUsername: 'jane@example.com',
        mockPassword: 'test1234',
        mockCode: 123456,
        mockJwtToken: 'TEST-ACCESS-TOKEN-AUTO',
      },
    },
  },
};
