import { module, test } from 'qunit';
import {
  visit,
  currentRouteName,
  setupOnerror,
  resetOnerror,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { assign } from '@ember/polyfills';
import { createJWTToken } from 'ember-cognito-identity/test-support/helpers/create-jwt-token';
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';
import { CognitoError } from 'ember-cognito-identity/errors/cognito';

module('Acceptance | remember-authentication', function (hooks) {
  setupApplicationTest(hooks);
  setupCognitoMocks(hooks);

  test('it correctly loads a user from the cache', async function (assert) {
    let { cognito, cognitoStorage } = this;

    let accessToken = createJWTToken();

    this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = (body) => {
      assert.step('GetUser is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          AccessToken: accessToken,
        },
        'correct body is sent'
      );

      return {
        UserAttributes: [
          { Name: 'sub', Value: '5e456280-cdb6-40f7-a259-565e4f01debf' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'francesco@fabscale.com' },
        ],

        Username: '5e456280-cdb6-40f7-a259-565e4f01debf',
      };
    };

    // Normally, it would load the user from the localstorage
    // But we mock this here and load it from memory
    // This would be set by the authentication
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.LastAuthUser',
      'TEST-USER-ID'
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.accessToken',
      accessToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.refreshToken',
      accessToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.idToken',
      accessToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.clockDrift',
      0
    );

    await visit('/');

    assert.equal(currentRouteName(), 'index', 'user is on index page');
    assert.ok(cognito.isAuthenticated, 'user is authenticated');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      accessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps(['GetUser is called']);
  });

  test('it correctly redirects to login if no cache is available', async function (assert) {
    let { cognito } = this;

    await visit('/');

    assert.equal(currentRouteName(), 'login', 'user is on login page');
    assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
  });

  test('it handles an expired access token by using the refresh token', async function (assert) {
    let { cognito, cognitoStorage } = this;

    let accessToken = createJWTToken({
      exp: Math.round(new Date() / 1000) - 1000,
    });
    let refreshToken = createJWTToken();
    let newAccessToken = createJWTToken({
      exp: Math.round(new Date() / 1000) + 1000,
    });

    this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = (body) => {
      assert.step('GetUser is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          AccessToken: newAccessToken,
        },
        'correct body is sent'
      );

      return {
        UserAttributes: [
          { Name: 'sub', Value: '5e456280-cdb6-40f7-a259-565e4f01debf' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'francesco@fabscale.com' },
        ],

        Username: '5e456280-cdb6-40f7-a259-565e4f01debf',
      };
    };

    this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = (
      body
    ) => {
      assert.step('InitiateAuth is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },

          ClientId: 'TEST-CLIENT-ID',
          ClientMetadata: {},
        },
        'correct body is sent'
      );

      return {
        AuthenticationResult: {
          AccessToken: newAccessToken,
          ExpiresIn: 3600,
          IdToken: createJWTToken(),
          RefreshToken: createJWTToken(),
          TokenType: 'Bearer',
        },

        ChallengeParameters: {},
      };
    };

    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.LastAuthUser',
      'TEST-USER-ID'
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.accessToken',
      accessToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.refreshToken',
      refreshToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.idToken',
      accessToken
    );
    cognitoStorage.setItem(
      'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.clockDrift',
      0
    );

    await visit('/');

    assert.equal(currentRouteName(), 'index', 'user is on index page');
    assert.ok(cognito.isAuthenticated, 'user is authenticated');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      newAccessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps(['InitiateAuth is called', 'GetUser is called']);
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

    test('it handles an API error when trying to fetch a user from the cache', async function (assert) {
      let { cognito, cognitoStorage } = this;

      let accessToken = createJWTToken();

      this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
        assert.step('GetUser is called');

        return [
          400,
          {},
          { __type: 'UserNotFoundException', message: 'User does not exist.' },
        ];
      };

      // Normally, it would load the user from the localstorage
      // But we mock this here and load it from memory
      // This would be set by the authentication
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.LastAuthUser',
        'TEST-USER-ID'
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.accessToken',
        accessToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.refreshToken',
        accessToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.idToken',
        accessToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.clockDrift',
        0
      );

      await visit('/');

      assert.equal(currentRouteName(), 'login', 'user is on login page');
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert.deepEqual(cognitoStorage._data, {}, 'cognito storage is cleared');

      assert.verifySteps(['GetUser is called']);
    });

    test('it handles an API error when trying to refresh token', async function (assert) {
      let { cognito, cognitoStorage } = this;

      let accessToken = createJWTToken({
        exp: Math.round(new Date() / 1000) - 1000,
      });
      let refreshToken = createJWTToken();

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = (
        body
      ) => {
        assert.step('InitiateAuth is called');

        let normalizedBody = assign({}, body);

        assert.deepEqual(
          normalizedBody,
          {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: {
              REFRESH_TOKEN: refreshToken,
            },

            ClientId: 'TEST-CLIENT-ID',
            ClientMetadata: {},
          },
          'correct body is sent'
        );

        return [
          400,
          {},
          { __type: 'UserNotFoundException', message: 'User does not exist.' },
        ];
      };

      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.LastAuthUser',
        'TEST-USER-ID'
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.accessToken',
        accessToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.refreshToken',
        refreshToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.idToken',
        accessToken
      );
      cognitoStorage.setItem(
        'CognitoIdentityServiceProvider.TEST-CLIENT-ID.TEST-USER-ID.clockDrift',
        0
      );

      await visit('/');

      assert.equal(currentRouteName(), 'login', 'user is on login page');
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert.deepEqual(cognitoStorage._data, {}, 'cognito storage is cleared');

      assert.verifySteps(['InitiateAuth is called']);
    });
  });
});
