import { visit } from '@ember/test-helpers';
import click from '@ember/test-helpers/dom/click';
import fillIn from '@ember/test-helpers/dom/fill-in';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupApplicationTest } from 'ember-qunit';
import { TestContext as Context } from 'ember-test-helpers';
import { module, test } from 'qunit';
import { getMockConfig } from '../helpers/get-mock-config';

const AUTH_CODE = `${getMockConfig().mockCode}`;

type TestContext = Context & {
  cognito: CognitoService;
};

module('Acceptance | mfa', function (hooks) {
  setupApplicationTest(hooks);

  mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

  test('it allows to enable & disable MFA', async function (this: TestContext, assert) {
    await visit('/');

    assert.dom('[data-test-mfa-enable]').exists();
    assert.dom('[data-test-mfa-setup-secret]').doesNotExist();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').doesNotExist();

    await click('[data-test-mfa-enable]');

    assert.dom('[data-test-mfa-enable]').doesNotExist();
    assert.dom('[data-test-mfa-setup-secret]').exists();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').exists();

    assert.dom('[data-test-mfa-setup-secret]').hasText('TEST-SECRET');

    await fillIn('[data-test-mfa-setup-code]', AUTH_CODE);
    await click('[data-test-mfa-enable-confirm]');

    assert.dom('[data-test-mfa-enable]').doesNotExist();
    assert.dom('[data-test-mfa-setup-secret]').doesNotExist();
    assert.dom('[data-test-mfa-disable]').exists();
    assert.dom('[data-test-mfa-enable-confirm]').doesNotExist();

    await click('[data-test-mfa-disable]');

    assert.dom('[data-test-mfa-enable]').exists();
    assert.dom('[data-test-mfa-setup-secret]').doesNotExist();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').doesNotExist();

    assert.verifySteps([
      'cognitoUser.getUserData({"bypassCache":false})',
      'cognitoUser.associateSoftwareToken()',
      `cognitoUser.verifySoftwareToken(${AUTH_CODE}, MFA Device)`,
      'cognitoUser.setUserMfaPreference(true)',
      'cognitoUser.getUserData({"bypassCache":true})',
      'cognitoUser.getUserData({"bypassCache":false})',
      'cognitoUser.setUserMfaPreference(false)',
      'cognitoUser.getUserData({"bypassCache":true})',
      'cognitoUser.getUserData({"bypassCache":false})',
    ]);
  });

  test('it handles errors setting up MFA', async function (this: TestContext, assert) {
    await visit('/');

    assert.dom('[data-test-mfa-enable]').exists();
    assert.dom('[data-test-mfa-setup-secret]').doesNotExist();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').doesNotExist();

    await click('[data-test-mfa-enable]');

    assert.dom('[data-test-mfa-enable]').doesNotExist();
    assert.dom('[data-test-mfa-setup-secret]').exists();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').exists();

    assert.dom('[data-test-mfa-setup-secret]').hasText('TEST-SECRET');
    assert.dom('[data-test-cognito-error]').doesNotExist();

    await fillIn('[data-test-mfa-setup-code]', '111111');
    await click('[data-test-mfa-enable-confirm]');

    assert.dom('[data-test-mfa-enable]').doesNotExist();
    assert.dom('[data-test-mfa-setup-secret]').exists();
    assert.dom('[data-test-mfa-disable]').doesNotExist();
    assert.dom('[data-test-mfa-enable-confirm]').exists();

    assert
      .dom('[data-test-cognito-error]')
      .hasText('The MFA code is invalid, please try again.');

    assert.verifySteps([
      'cognitoUser.getUserData({"bypassCache":false})',
      'cognitoUser.associateSoftwareToken()',
      'cognitoUser.verifySoftwareToken(111111, MFA Device)',
    ]);
  });
});
