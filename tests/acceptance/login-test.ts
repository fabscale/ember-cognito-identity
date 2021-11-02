import { click, fillIn, visit } from '@ember/test-helpers';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { MOCK_COGNITO_CONFIG } from 'ember-cognito-identity/utils/mock/cognito-user';
import { setupApplicationTest } from 'ember-qunit';
import { TestContext as Context } from 'ember-test-helpers';
import { module, test } from 'qunit';
import { getMockConfig } from '../helpers/get-mock-config';

const JWT_TOKEN = getMockConfig().mockJwtToken;
const USERNAME = getMockConfig().mockUsername;
const AUTH_CODE = `${getMockConfig().mockCode}`;
const PASSWORD = getMockConfig().mockPassword;

type TestContext = Context & {
  cognito: CognitoService;
};

module('Acceptance | login', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: TestContext, assert) {
    this.cognito = this.owner.lookup('service:cognito');
    this.cognito._assert = assert;
  });

  test('it works with correct username & password', async function (this: TestContext, assert) {
    let { cognito } = this;

    await visit('/login');

    assert.notOk(
      cognito.isAuthenticated,
      'user is not authenticated initially'
    );

    await fillIn('[data-test-login-form-username]', USERNAME);
    await fillIn('[data-test-login-form-password]', PASSWORD);
    await click('[data-test-login-form-submit]');

    assert.ok(cognito.isAuthenticated, 'user is authenticated now');
    assert.strictEqual(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      JWT_TOKEN,
      'correct jwtToken is set on service'
    );

    assert.verifySteps([
      `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
      'cognitoUser.getSession()',
      'cognitoUser.getUserData({"bypassCache":false})',
      'cognitoUser.getUserData({"bypassCache":false})',
    ]);
  });

  module('errors', function () {
    test('it handles an unknown username', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('This user does not exist.');

      assert.verifySteps([
        'cognitoUser.authenticateUser(johnwick@fabscale.com, test1234)',
      ]);
    });

    test('it handles an incorrect password', async function (this: TestContext, assert) {
      let { cognito } = this;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      await fillIn('[data-test-login-form-username]', USERNAME);
      await fillIn('[data-test-login-form-password]', 'test');
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The password you provided is incorrect.');

      assert.verifySteps([`cognitoUser.authenticateUser(${USERNAME}, test)`]);
    });

    test('it handles a user that needs to set an initial password', async function (this: TestContext, assert) {
      let { cognito } = this;

      MOCK_COGNITO_CONFIG.mustEnterNewPassword = true;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', USERNAME);
      await fillIn('[data-test-login-form-password]', PASSWORD);
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter new password');
      assert.dom('[data-test-login-form-new-password]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-new-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.strictEqual(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        JWT_TOKEN,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'enter username and password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'enter new password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'cognitoUser.completeNewPasswordChallenge(test1234, {})',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'cognitoUser.getSession()',
        'cognitoUser.getUserData({"bypassCache":false})',
        'cognitoUser.getUserData({"bypassCache":false})',
      ]);
    });

    test('it handles the user trying to set an invalid initial password', async function (this: TestContext, assert) {
      let { cognito } = this;

      MOCK_COGNITO_CONFIG.mustEnterNewPassword = true;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', USERNAME);
      await fillIn('[data-test-login-form-password]', PASSWORD);
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter new password');
      assert.dom('[data-test-login-form-new-password]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-new-password]', 'test');
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText(
          'Password does not conform to policy: Password not long enough'
        );

      assert.verifySteps([
        'enter username and password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'enter new password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'cognitoUser.completeNewPasswordChallenge(test, {})',
      ]);

      MOCK_COGNITO_CONFIG.mustEnterNewPassword = false;
    });

    test('it handles a user that needs an MFA code', async function (this: TestContext, assert) {
      let { cognito } = this;

      MOCK_COGNITO_CONFIG.mustEnterMfaCode = true;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', USERNAME);
      await fillIn('[data-test-login-form-password]', PASSWORD);
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter mfa code');
      assert.dom('[data-test-login-form-mfa-code]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-mfa-code]', AUTH_CODE);
      await click('[data-test-login-form-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.strictEqual(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        JWT_TOKEN,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'enter username and password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'enter mfa code',
        'cognitoUser.sendMFACode(123456)',
        'cognitoUser.getSession()',
        'cognitoUser.getUserData({"bypassCache":false})',
        'cognitoUser.getUserData({"bypassCache":false})',
      ]);
    });

    test('it handles an incorrect MFA code', async function (this: TestContext, assert) {
      let { cognito } = this;

      MOCK_COGNITO_CONFIG.mustEnterMfaCode = true;

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', USERNAME);
      await fillIn('[data-test-login-form-password]', PASSWORD);
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter mfa code');
      assert.dom('[data-test-login-form-mfa-code]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-mfa-code]', '999999');
      await click('[data-test-login-form-submit]');

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert.dom('[data-test-cognito-error]').exists({ count: 1 });
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The MFA code is invalid, please try again.');

      assert.verifySteps([
        'enter username and password',
        `cognitoUser.authenticateUser(${USERNAME}, ${PASSWORD})`,
        'enter mfa code',
        'cognitoUser.sendMFACode(999999)',
      ]);

      MOCK_COGNITO_CONFIG.mustEnterMfaCode = false;
    });
  });
});
