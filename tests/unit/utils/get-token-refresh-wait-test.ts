import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { getTokenRefreshWait } from 'ember-cognito-identity/utils/get-token-refresh-wait';
import { module, test } from 'qunit';

module('Unit | Utility | get-token-refresh-wait', function () {
  test('it works with missing/empty expiration', function (assert) {
    let mockSession = {
      getAccessToken() {
        return {
          getExpiration() {
            return undefined;
          },
        };
      },
    } as unknown as CognitoUserSession;

    let result = getTokenRefreshWait(mockSession);

    // 45 minutes
    assert.strictEqual(result, 2700000);
  });

  test('it works with expiration in the future', function (assert) {
    let now = new Date();

    let mockSession = {
      getAccessToken() {
        return {
          getExpiration() {
            return Math.floor(+now / 1000 + 20 * 60);
          },
        };
      },
    } as unknown as CognitoUserSession;

    let result = getTokenRefreshWait(mockSession);

    // 5 minutes
    assert.strictEqual(result, 300000);
  });

  test('it works with expiration in the past', function (assert) {
    let now = new Date();

    let mockSession = {
      getAccessToken() {
        return {
          getExpiration() {
            return Math.floor(+now / 1000 - 5 * 60);
          },
        };
      },
    } as unknown as CognitoUserSession;

    let result = getTokenRefreshWait(mockSession);

    // 5 minutes
    assert.strictEqual(result, 0);
  });

  test('it works with expiration in the future, but below margin/threshold', function (assert) {
    let now = new Date();

    let mockSession = {
      getAccessToken() {
        return {
          getExpiration() {
            return Math.floor(+now / 1000 + 5 * 60);
          },
        };
      },
    } as unknown as CognitoUserSession;

    let result = getTokenRefreshWait(mockSession);

    // 5 minutes
    assert.strictEqual(result, 0);
  });
});
