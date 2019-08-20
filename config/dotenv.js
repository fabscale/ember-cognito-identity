'use strict';

const path = require('path');

module.exports = function(env) {
  return {
    clientAllowedKeys:
      env === 'test' ? [] : ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'],
    fastbootAllowedKeys: [],
    failOnMissingKey: false,
    path: path.join(path.dirname(__dirname), '.env')
  };
};
