import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';
import { setupPretenderSuccessfulLogin } from 'ember-cognito-identity/test-support/pretender/login';
import { resetOnerror, setupOnerror } from '@ember/test-helpers';
import {
  CognitoError,
  CognitoNotAuthenticatedError,
} from 'ember-cognito-identity/errors/cognito';

module('Unit | Service | cognito', function (hooks) {
  setupTest(hooks);
  setupCognitoMocks(hooks);

  test('restoreAndLoad rejects with null if not signed in', async function (assert) {
    let service = this.owner.lookup('service:cognito');

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
    hooks.beforeEach(async function () {
      setupPretenderSuccessfulLogin(this);
      setupOnerror((error) => {
        // ignore cognito errors, as they are handled in the UI
        if (error instanceof CognitoError) {
          return;
        }

        throw error;
      });

      this.service = this.owner.lookup('service:cognito');
      this.service.onAuthenticated = () => {};

      await this.service.authenticate({
        username: 'johnwick@thecontinental.assassins',
        password: 'test1234',
      });
    });

    hooks.afterEach(function () {
      resetOnerror();
    });

    test('it works', async function (assert) {
      let { service } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.UpdateUserAttributes'
      ] = (body) => {
        assert.deepEqual(body, {
          AccessToken: this.cognitoAccessToken,
          UserAttributes: [
            {
              Name: 'name',
              Value: 'John W.',
            },
            {
              Name: 'age',
              Value: 52,
            },
          ],
        });
        return {};
      };

      this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
        return {
          UserAttributes: [
            { Name: 'sub', Value: 'TEST-USER-ID' },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'email', Value: 'johnwick@thecontinental.assassins' },
            { Name: 'name', Value: 'John W.' },
          ],

          Username: 'TEST-USER-ID',
        };
      };

      let response = await service.updateAttributes({
        name: 'John W.',
        age: 52,
      });

      /* eslint-disable camelcase */
      assert.deepEqual(response, {
        email: 'johnwick@thecontinental.assassins',
        email_verified: 'true',
        name: 'John W.',
        sub: 'TEST-USER-ID',
      });
      /* eslint-enable camelcase */
      assert.deepEqual(service.cognitoData.userAttributes, response);
    });

    test('it handles a server error when updating the attributes', async function (assert) {
      let { service } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.UpdateUserAttributes'
      ] = () => {
        return [
          400,
          {},
          {
            __type: 'NotAuthorizedException',
            message: 'A client attempted to write unauthorized attribute',
          },
        ];
      };

      try {
        await service.updateAttributes({
          name: 'John W.',
          age: 52,
        });
      } catch (error) {
        assert.equal(
          error.message,
          'A client attempted to write unauthorized attribute'
        );
      }
    });
  });

  module('updatePassword', function (hooks) {
    hooks.beforeEach(async function () {
      setupPretenderSuccessfulLogin(this);
      setupOnerror((error) => {
        // ignore cognito errors, as they are handled in the UI
        if (error instanceof CognitoError) {
          return;
        }

        throw error;
      });

      this.service = this.owner.lookup('service:cognito');
      this.service.onAuthenticated = () => {};

      await this.service.authenticate({
        username: 'johnwick@thecontinental.assassins',
        password: 'test1234',
      });
    });

    hooks.afterEach(function () {
      resetOnerror();
    });

    test('it works', async function (assert) {
      let { service } = this;

      this.awsHooks['AWSCognitoIdentityProviderService.ChangePassword'] = (
        body
      ) => {
        assert.deepEqual(body, {
          AccessToken: this.cognitoAccessToken,
          PreviousPassword: 'test1234',
          ProposedPassword: 'new-test1234',
        });
        return {};
      };

      await service.updatePassword({
        oldPassword: 'test1234',
        newPassword: 'new-test1234',
      });

      assert.ok(true);
    });

    test('it handles a server error when updating the password', async function (assert) {
      let { service } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ChangePassword'
      ] = () => {
        return [
          400,
          {},
          {
            __type: 'NotAuthorizedException',
            message: 'Incorrect username or password.',
          },
        ];
      };

      try {
        await service.updatePassword({
          oldPassword: 'test1234',
          newPassword: 'new-test1234',
        });
      } catch (error) {
        assert.equal(error.message, 'The password you provided is incorrect.');
      }
    });
  });
});
