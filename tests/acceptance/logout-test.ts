import {
  click,
  currentRouteName,
  TestContext as Context,
  visit,
} from '@ember/test-helpers';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { getMockConfig } from '../helpers/get-mock-config';

type TestContext = Context & {
  cognito: CognitoService;
};

module('Acceptance | logout', function (hooks) {
  setupApplicationTest(hooks);

  mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

  hooks.beforeEach(function (this: TestContext) {
    let cognito = this.owner.lookup('service:cognito') as CognitoService;
    this.cognito = cognito;
  });

  test('it allows to logout', async function (this: TestContext, assert) {
    let { cognito } = this;

    await visit('/');

    assert.strictEqual(currentRouteName(), 'index', 'user is on index page');
    assert.ok(cognito.isAuthenticated, 'user is authenticated');
    assert.strictEqual(
      cognito.session?.jwtToken,
      getMockConfig().mockJwtToken,
      'correct jwtToken is set on service'
    );

    await click('[data-test-logout]');

    assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
    assert.strictEqual(cognito.session, undefined, 'session is reset');
    assert.strictEqual(cognito.user, undefined, 'user is reset');
    assert.true(!!cognito.unauthenticated, 'unauthenticated is available');

    assert.verifySteps([
      'cognitoUser.getUserData({"bypassCache":false})',
      'cognitoUser.signOut()',
    ]);
  });
});
