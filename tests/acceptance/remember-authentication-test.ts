import {
  currentRouteName,
  resetOnerror,
  setupOnerror,
  visit,
  TestContext as Context,
} from '@ember/test-helpers';
import {
  AmazonCognitoIdentityJsError,
  CognitoError,
} from 'ember-cognito-identity/errors/cognito';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';
import { timeout } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { getMockConfig } from '../helpers/get-mock-config';

type TestContext = Context & {
  cognito: CognitoService;
};

module('Acceptance | remember-authentication', function (hooks) {
  setupApplicationTest(hooks);

  test('it correctly redirects to login if no cache is available', async function (this: TestContext, assert) {
    let cognito = this.owner.lookup('service:cognito') as CognitoService;

    await visit('/');

    assert.strictEqual(currentRouteName(), 'login', 'user is on login page');
    assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
  });

  module('signed in', function (hooks) {
    mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

    hooks.beforeEach(function (this: TestContext) {
      let cognito = this.owner.lookup('service:cognito') as CognitoService;
      this.cognito = cognito;
    });

    test('it correctly loads a user from the cache', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/');

      assert.strictEqual(currentRouteName(), 'index', 'user is on index page');
      assert.ok(cognito.isAuthenticated, 'user is authenticated');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        getMockConfig().mockJwtToken,
        'correct jwtToken is set on service'
      );

      assert.verifySteps(['cognitoUser.getUserData({"bypassCache":false})']);
    });

    test('it correctly refreshes the access token', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/');

      assert.strictEqual(currentRouteName(), 'index', 'user is on index page');
      assert.ok(cognito.isAuthenticated, 'user is authenticated');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        getMockConfig().mockJwtToken,
        'correct jwtToken is set on service'
      );

      // setExpireIn is only available on MockCognitoUserSession
      // @ts-ignore
      cognito.cognitoData?.cognitoUserSession.setExpireIn(2 + 15 * 60);

      assert.step('now run auto-refresh');
      taskFor(cognito._debouncedRefreshAccessToken).perform();

      await timeout(1400);

      assert.step('still not refreshed');

      await timeout(1000);

      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        `${getMockConfig().mockJwtToken}-REFRESHED`,
        'correct jwtToken is updated on service'
      );

      assert.verifySteps([
        'cognitoUser.getUserData({"bypassCache":false})',
        'now run auto-refresh',
        'still not refreshed',
        'cognitoUser.refreshSession()',
        'cognitoUser.getSession()',
        'cognitoUser.getUserData({"bypassCache":false})',
      ]);
    });
  });

  module('errors', function (hooks) {
    hooks.beforeEach(function () {
      setupOnerror((error) => {
        // ignore cognito errors, as they are handled in the UI
        if (error instanceof CognitoError) {
          return;
        }

        throw error;
      });
    });

    hooks.afterEach(function () {
      resetOnerror();
    });

    test('it handles an API error when trying to refresh token', async function (this: TestContext, assert) {
      let cognito = this.owner.lookup('service:cognito') as CognitoService;

      cognito.cognitoData = mockCognitoData({
        assert,
      })!;

      cognito.cognitoData.cognitoUser.refreshSession = (
        _: any,
        callback: (error: null | AmazonCognitoIdentityJsError) => void
      ) => {
        assert.step(`cognitoUser.refreshSession()`);

        // setExpireIn is only available on MockCognitoUserSession
        // @ts-ignore
        cognito.cognitoData!.cognitoUserSession.setExpireIn(20 * 60);

        callback({
          code: 'UserNotFoundException',
          name: 'UserNotFoundException',
          message: 'User does not exist.',
        });
      };

      await visit('/');

      assert.strictEqual(currentRouteName(), 'index', 'user is on index page');
      assert.ok(cognito.isAuthenticated, 'user is authenticated');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        getMockConfig().mockJwtToken,
        'correct jwtToken is set on service'
      );

      // setExpireIn is only available on MockCognitoUserSession
      // @ts-ignore
      cognito.cognitoData.cognitoUserSession.setExpireIn(1 + 15 * 60);

      assert.step('now run auto-refresh');
      taskFor(cognito._debouncedRefreshAccessToken).perform();

      await timeout(1400);

      assert.strictEqual(currentRouteName(), 'index', 'user is on index page');
      assert.ok(cognito.isAuthenticated, 'user is authenticated');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        getMockConfig().mockJwtToken,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'cognitoUser.getUserData({"bypassCache":false})',
        'now run auto-refresh',
        'cognitoUser.refreshSession()',
      ]);
    });
  });
});
