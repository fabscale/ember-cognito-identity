import {
  click,
  currentRouteName,
  fillIn,
  resetOnerror,
  setupOnerror,
  visit,
  TestContext as Context,
} from '@ember/test-helpers';
import { CognitoError } from 'ember-cognito-identity/errors/cognito';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { getMockConfig } from '../helpers/get-mock-config';

type TestContext = Context & {
  cognito: CognitoService;
};

const JWT_TOKEN = getMockConfig().mockJwtToken;
const USERNAME = getMockConfig().mockUsername;
const AUTH_CODE = `${getMockConfig().mockCode}`;
const PASSWORD = getMockConfig().mockPassword;

module('Acceptance | reset-password', function (hooks) {
  setupApplicationTest(hooks);

  module('signed in', function (hooks) {
    mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

    test('it allows to generate a code & reset the password', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-send-verification-code]');

      assert.dom('[data-test-reset-password-username]').doesNotExist();
      assert
        .dom('[data-test-reset-password-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-skip-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-username-info]')
        .hasText(`Reset password for: ${USERNAME}`);

      // Now actually reset the password
      await fillIn('[data-test-reset-password-verification-code]', AUTH_CODE);
      await fillIn('[data-test-reset-password-new-password]', PASSWORD);
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        JWT_TOKEN,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'cognitoUser.forgotPassword()',
        'cognitoUser.confirmPassword(123456, test1234)',
      ]);
    });

    test('it allows to reset the password with an existing code', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-skip-send-verification-code]');

      assert.dom('[data-test-reset-password-username]').doesNotExist();
      assert
        .dom('[data-test-reset-password-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-skip-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-username-info]')
        .hasText(`Reset password for: ${USERNAME}`);

      // Now actually reset the password
      await fillIn('[data-test-reset-password-verification-code]', AUTH_CODE);
      await fillIn('[data-test-reset-password-new-password]', PASSWORD);
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        JWT_TOKEN,
        'correct jwtToken is set on service'
      );

      assert.verifySteps(['cognitoUser.confirmPassword(123456, test1234)']);
    });

    test('it allows to resend a code & reset the password', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-skip-send-verification-code]');
      await click('[data-test-reset-password-resend-verification-code]');

      assert.dom('[data-test-reset-password-username]').hasValue(USERNAME);

      await click('[data-test-reset-password-send-verification-code]');

      assert.dom('[data-test-reset-password-username]').doesNotExist();
      assert
        .dom('[data-test-reset-password-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-skip-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-username-info]')
        .hasText(`Reset password for: ${USERNAME}`);

      // Now actually reset the password
      await fillIn('[data-test-reset-password-verification-code]', AUTH_CODE);
      await fillIn('[data-test-reset-password-new-password]', PASSWORD);
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.strictEqual(
        cognito.cognitoData?.jwtToken,
        JWT_TOKEN,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'cognitoUser.forgotPassword()',
        'cognitoUser.confirmPassword(123456, test1234)',
      ]);
    });
  });

  module('errors', function (hooks) {
    hooks.beforeEach(function (this: TestContext, assert) {
      setupOnerror((error) => {
        // ignore cognito errors, as they are handled in the UI
        if (error instanceof CognitoError) {
          return;
        }

        throw error;
      });

      this.cognito = this.owner.lookup('service:cognito') as CognitoService;
      this.cognito._assert = assert;
    });

    hooks.afterEach(function () {
      resetOnerror();
    });

    test('it handles errors when trying to generate a code', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-send-verification-code]');

      assert.strictEqual(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('This user does not exist.');

      assert.verifySteps(['cognitoUser.forgotPassword()']);
    });

    test('it handles an invalid verification code', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', '111111');
      await fillIn('[data-test-reset-password-new-password]', PASSWORD);
      await click('[data-test-reset-password-submit]');

      assert.strictEqual(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The verification code is expired, please request a new one.');

      assert.verifySteps(['cognitoUser.confirmPassword(111111, test1234)']);
    });

    test('it handles an invalid new password', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', AUTH_CODE);
      await fillIn('[data-test-reset-password-new-password]', 'test');
      await click('[data-test-reset-password-submit]');

      assert.strictEqual(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText(
          'Password does not conform to policy: Password not long enough'
        );

      assert.verifySteps(['cognitoUser.confirmPassword(123456, test)']);
    });

    // TODO FN: Maybe this can be handled more gracefully (although it is rather an edge case...)
    test('it handles an error during authentication (after password reset)', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/reset-password');

      await fillIn('[data-test-reset-password-username]', USERNAME);
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', AUTH_CODE);
      await fillIn('[data-test-reset-password-new-password]', 'test5678');
      await click('[data-test-reset-password-submit]');

      assert.strictEqual(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The password you provided is incorrect.');

      assert.verifySteps([
        'cognitoUser.confirmPassword(123456, test5678)',
        'cognitoUser.authenticateUser(jane@example.com, test5678)',
      ]);
    });
  });
});
