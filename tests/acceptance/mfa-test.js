import { visit } from '@ember/test-helpers';
import click from '@ember/test-helpers/dom/click';
import fillIn from '@ember/test-helpers/dom/fill-in';
import mockCognito from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Acceptance | mfa', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockCognito(this);
  });

  test('it allows to enable & disable MFA', async function (assert) {
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

    await fillIn('[data-test-mfa-setup-code]', '123456');
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
  });

  test('it handles errors setting up MFA', async function (assert) {
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
  });
});
