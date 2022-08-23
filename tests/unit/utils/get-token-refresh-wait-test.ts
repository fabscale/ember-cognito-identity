import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { getTokenRefreshWait } from 'ember-cognito-identity/utils/get-token-refresh-wait';
import { mockCognitoUserSession } from 'ember-cognito-identity/utils/mock/cognito-user-session';
import { module, test } from 'qunit';

module('Unit | Utility | get-token-refresh-wait', function () {
  test('it works with expiration in the future', function (assert) {
    let now = new Date();

    let mockSession = mockCognitoUserSession()!;

    mockSession.getAccessToken = () => {
      return {
        getJwtToken: () => {
          return 'XXX';
        },

        getExpiration() {
          return Math.floor(+now / 1000 + 20 * 60);
        },
      };
    };

    let result = getTokenRefreshWait(
      mockSession as unknown as CognitoUserSession
    );

    // 5 minutes
    assert.strictEqual(result, 300000);
  });

  test('it works with expiration in the past', function (assert) {
    let now = new Date();

    let mockSession = mockCognitoUserSession()!;

    mockSession.getAccessToken = () => {
      return {
        getJwtToken: () => {
          return 'XXX';
        },

        getExpiration() {
          return Math.floor(+now / 1000 - 5 * 60);
        },
      };
    };

    let result = getTokenRefreshWait(
      mockSession as unknown as CognitoUserSession
    );

    // 5 minutes
    assert.strictEqual(result, 0);
  });

  test('it works with expiration in the future, but below margin/threshold', function (assert) {
    let now = new Date();

    let mockSession = mockCognitoUserSession()!;

    mockSession.getAccessToken = () => {
      return {
        getJwtToken: () => {
          return 'XXX';
        },

        getExpiration() {
          return Math.floor(+now / 1000 + 5 * 60);
        },
      };
    };

    let result = getTokenRefreshWait(
      mockSession as unknown as CognitoUserSession
    );

    // 5 minutes
    assert.strictEqual(result, 0);
  });
});
