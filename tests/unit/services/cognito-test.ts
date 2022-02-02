import {
  resetOnerror,
  setupOnerror,
  TestContext as Context,
} from '@ember/test-helpers';
import {
  AmazonCognitoIdentityJsError,
  CognitoError,
  CognitoNotAuthenticatedError,
} from 'ember-cognito-identity/errors/cognito';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

type TestContext = Context & {
  cognito: CognitoService;
};

module('Unit | Service | cognito', function (hooks) {
  setupTest(hooks);

  test('restoreAndLoad rejects with null if not signed in', async function (this: TestContext, assert) {
    let service = this.owner.lookup('service:cognito') as CognitoService;

    try {
      await service.restoreAndLoad();
    } catch (error) {
      assert.step('restoreAndLoad rejects');
      assert.ok(
        error instanceof CognitoNotAuthenticatedError,
        'it rejects with an CognitoNotAuthenticatedError'
      );
    }

    assert.verifySteps(['restoreAndLoad rejects']);
  });

  module('updateAttributes', function (hooks) {
    mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

    hooks.beforeEach(async function () {
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

    test('it works', async function (this: TestContext, assert) {
      let { cognito } = this;

      let response = await cognito.updateAttributes({
        name: 'John W.',
        age: '52',
      });

      /* eslint-disable camelcase */
      assert.deepEqual(response, {
        email: 'jane@example.com',
        email_verified: 'true',
        sub: 'aaa-bbb-ccc',
      });
      /* eslint-enable camelcase */
      assert.deepEqual(cognito.cognitoData!.userAttributes, response);

      assert.verifySteps([
        'cognitoUser.updateAttributes()',
        'cognitoUser.getUserData({"bypassCache":false})',
      ]);
    });

    test('it handles a server error when updating the attributes', async function (this: TestContext, assert) {
      let { cognito } = this;

      cognito.cognitoData!.cognitoUser.updateAttributes = (
        _: any,
        callback: (error: AmazonCognitoIdentityJsError) => void
      ) => {
        assert.step(`cognitoUser.updateAttributes()`);

        callback({
          code: 'NotAuthorizedException',
          name: 'NotAuthorizedException',
          message: 'A client attempted to write unauthorized attribute',
        });
      };

      try {
        await cognito.updateAttributes({
          name: 'John W.',
          age: '52',
        });
      } catch (error) {
        assert.step('error occurred');
        assert.strictEqual(
          error.message,
          'A client attempted to write unauthorized attribute'
        );
      }

      assert.verifySteps(['cognitoUser.updateAttributes()', 'error occurred']);
    });
  });

  module('updatePassword', function (hooks) {
    mockCognitoAuthenticated(hooks, { includeAssertSteps: true });

    hooks.beforeEach(async function () {
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

    test('it works', async function (this: TestContext, assert) {
      let { cognito } = this;

      await cognito.updatePassword({
        oldPassword: 'test1234',
        newPassword: 'new-test1234',
      });

      assert.verifySteps([
        'cognitoUser.changePassword(test1234, new-test1234)',
      ]);
    });

    test('it handles a server error when updating the password', async function (this: TestContext, assert) {
      let { cognito } = this;

      cognito.cognitoData!.cognitoUser.changePassword = (
        _: any,
        _2: any,
        callback: (error: AmazonCognitoIdentityJsError) => void
      ) => {
        assert.step(`cognitoUser.changePassword()`);

        callback({
          code: 'NotAuthorizedException',
          name: 'NotAuthorizedException',
          message: 'Incorrect username or password.',
        });
      };

      try {
        await cognito.updatePassword({
          oldPassword: 'test1234',
          newPassword: 'new-test1234',
        });
      } catch (error) {
        assert.strictEqual(
          error.message,
          'The password you provided is incorrect.'
        );
        assert.step('error occurred');
      }

      assert.verifySteps(['cognitoUser.changePassword()', 'error occurred']);
    });
  });
});
