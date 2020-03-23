import { module, test } from 'qunit';
import {
  visit,
  currentRouteName,
  fillIn,
  click,
  settled,
  resetOnerror,
  setupOnerror,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { mockCognito } from '@fabscale/ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupCognitoMocks } from '@fabscale/ember-cognito-identity/test-support/pretender';
import {
  setupPretenderSuccessfulLogin,
  setupPretenderInvalidPassword,
  setupPretenderNeedsInitialPassword,
} from '@fabscale/ember-cognito-identity/test-support/pretender/login';
import { setupPretenderResetPassword } from '@fabscale/ember-cognito-identity/test-support/pretender/reset-password';
import { CognitoError } from '@fabscale/ember-cognito-identity/errors/cognito';

module('Acceptance | test helpers', function (hooks) {
  setupApplicationTest(hooks);

  module('mockCognito', function () {
    test('test helper correctly mocks a cognito session', async function (assert) {
      mockCognito(this, { accessToken: 'TEST-ACCESS-TOKEN' });

      await visit('/');

      assert.equal(currentRouteName(), 'index', 'user is on index page');
      let cognito = this.owner.lookup('service:cognito');

      assert.equal(
        cognito.cognitoData.jwtToken,
        'TEST-ACCESS-TOKEN',
        'correct dummy access token is generated'
      );

      // Ensure restoreAndLoad can be called without side effects
      await cognito.restoreAndLoad();
    });
  });

  module('pretender', function (hooks) {
    setupCognitoMocks(hooks);

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

    test('setupPretenderSuccessfulLogin works', async function (assert) {
      setupPretenderSuccessfulLogin(this);
      let { cognito, cognitoAccessToken } = this;

      await visit('/login');

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      await settled();

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        cognitoAccessToken,
        'correct jwtToken is set on service'
      );
    });

    test('setupPretenderNeedsInitialPassword works', async function (assert) {
      setupPretenderNeedsInitialPassword(this);
      let { cognito } = this;

      await visit('/login');

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');
      await settled();

      await fillIn('[data-test-login-form-new-password]', 'test1234-NEW');
      await click('[data-test-login-form-submit]');
      await settled();

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        this.cognitoAccessToken,
        'correct jwtToken is set on service'
      );
    });

    test('setupPretenderInvalidPassword works', async function (assert) {
      setupPretenderInvalidPassword(this);
      let { cognito } = this;

      await visit('/login');

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The password you provided is incorrect.');
    });

    test('setupPretenderResetPassword works', async function (assert) {
      setupPretenderResetPassword(this);
      setupPretenderSuccessfulLogin(this);
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-send-verification-code]');
      await settled();

      await fillIn('[data-test-reset-password-verification-code]', '123456');
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        this.cognitoAccessToken,
        'correct jwtToken is set on service'
      );
    });
  });
});
