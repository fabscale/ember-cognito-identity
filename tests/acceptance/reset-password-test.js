import { module, test } from 'qunit';
import {
  visit,
  fillIn,
  click,
  settled,
  resetOnerror,
  setupOnerror,
  currentRouteName
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { assign } from '@ember/polyfills';
import { createJWTToken } from 'ember-cognito-identity/test-support/helpers/create-jwt-token';
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';
import { CognitoError } from 'ember-cognito-identity/errors/cognito';

module('Acceptance | reset-password', function(hooks) {
  setupApplicationTest(hooks);
  setupCognitoMocks(hooks);

  test('it allows to generate a code & reset the password', async function(assert) {
    let { cognito } = this;

    let accessToken = createJWTToken();

    this.awsHooks['AWSCognitoIdentityProviderService.ForgotPassword'] = (
      body
    ) => {
      assert.step('ForgotPassword is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          ClientId: 'TEST-CLIENT-ID',
          Username: 'johnwick@fabscale.com'
        },
        'correct body is sent'
      );

      return {
        CodeDeliveryDetails: {
          AttributeName: 'email',
          DeliveryMedium: 'EMAIL',
          Destination: 'j***@f***.com'
        }
      };
    };

    this.awsHooks['AWSCognitoIdentityProviderService.ConfirmForgotPassword'] = (
      body
    ) => {
      assert.step('ConfirmForgotPassword is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          ClientId: 'TEST-CLIENT-ID',
          Username: 'johnwick@fabscale.com',
          ConfirmationCode: '123456',
          Password: 'test1234'
        },
        'correct body is sent'
      );

      return {};
    };

    this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = (
      body
    ) => {
      assert.step('InitiateAuth is called');

      let normalizedBody = assign({}, body);
      normalizedBody.AuthParameters.SRP_A = 'TEST-SRP-A';

      assert.deepEqual(
        normalizedBody,
        {
          AuthFlow: 'USER_SRP_AUTH',
          ClientId: 'TEST-CLIENT-ID',
          AuthParameters: {
            USERNAME: 'johnwick@fabscale.com',
            SRP_A: 'TEST-SRP-A'
          },
          ClientMetadata: {}
        },
        'correct body is sent'
      );

      return {
        ChallengeName: 'PASSWORD_VERIFIER',
        ChallengeParameters: {
          SALT: 'TEST-SALT',
          SECRET_BLOCK: 'TEST-SECRET-BLOCK',
          USERNAME: 'TEST-USER-ID',
          USER_ID_FOR_SRP: 'TEST-USER-ID'
        }
      };
    };

    this.awsHooks[
      'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
    ] = (body) => {
      assert.step('RespondToAuthChallenge is called');

      let normalizedBody = assign({}, body);
      normalizedBody.ChallengeResponses.PASSWORD_CLAIM_SIGNATURE =
        'TEST-CLAIM-SIGNATURE';
      normalizedBody.ChallengeResponses.TIMESTAMP = 'timestamp';

      assert.deepEqual(
        normalizedBody,
        {
          ChallengeName: 'PASSWORD_VERIFIER',
          ClientId: 'TEST-CLIENT-ID',
          ChallengeResponses: {
            USERNAME: 'TEST-USER-ID',
            PASSWORD_CLAIM_SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            TIMESTAMP: 'timestamp',
            PASSWORD_CLAIM_SIGNATURE: 'TEST-CLAIM-SIGNATURE'
          }
        },
        'correct body is sent'
      );

      return {
        AuthenticationResult: {
          AccessToken: accessToken,
          ExpiresIn: 3600,
          IdToken: createJWTToken(),
          RefreshToken: createJWTToken(),
          TokenType: 'Bearer'
        },
        ChallengeParameters: {}
      };
    };

    this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = (body) => {
      assert.step('GetUser is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          AccessToken: accessToken
        },
        'correct body is sent'
      );

      return {
        UserAttributes: [
          { Name: 'sub', Value: 'TEST-USER-ID' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'johnwick@fabscale.com' }
        ],
        Username: 'TEST-USER-ID'
      };
    };

    await visit('/reset-password');

    await fillIn(
      '[data-test-reset-password-username]',
      'johnwick@fabscale.com'
    );
    await click('[data-test-reset-password-send-verification-code]');
    await settled();

    assert.dom('[data-test-reset-password-username]').doesNotExist();
    assert
      .dom('[data-test-reset-password-send-verification-code]')
      .doesNotExist();
    assert
      .dom('[data-test-reset-password-skip-send-verification-code]')
      .doesNotExist();
    assert
      .dom('[data-test-reset-password-username-info]')
      .hasText('Reset password for: johnwick@fabscale.com');

    // Now actually reset the password
    await fillIn('[data-test-reset-password-verification-code]', '123456');
    await fillIn('[data-test-reset-password-new-password]', 'test1234');
    await click('[data-test-reset-password-submit]');

    assert.ok(cognito.isAuthenticated, 'user is authenticated now');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      accessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps([
      'ForgotPassword is called',
      'ConfirmForgotPassword is called',
      'InitiateAuth is called',
      'RespondToAuthChallenge is called',
      'GetUser is called'
    ]);
  });

  test('it allows to reset the password with an existing code', async function(assert) {
    let { cognito } = this;

    let accessToken = createJWTToken();

    this.awsHooks['AWSCognitoIdentityProviderService.ConfirmForgotPassword'] = (
      body
    ) => {
      assert.step('ConfirmForgotPassword is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          ClientId: 'TEST-CLIENT-ID',
          Username: 'johnwick@fabscale.com',
          ConfirmationCode: '123456',
          Password: 'test1234'
        },
        'correct body is sent'
      );

      return {};
    };

    this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
      assert.step('InitiateAuth is called');

      return {
        ChallengeName: 'PASSWORD_VERIFIER',
        ChallengeParameters: {
          SALT: 'TEST-SALT',
          SECRET_BLOCK: 'TEST-SECRET-BLOCK',
          USERNAME: 'TEST-USER-ID',
          USER_ID_FOR_SRP: 'TEST-USER-ID'
        }
      };
    };

    this.awsHooks[
      'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
    ] = () => {
      assert.step('RespondToAuthChallenge is called');

      return {
        AuthenticationResult: {
          AccessToken: accessToken,
          ExpiresIn: 3600,
          IdToken: createJWTToken(),
          RefreshToken: createJWTToken(),
          TokenType: 'Bearer'
        },
        ChallengeParameters: {}
      };
    };

    this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = (body) => {
      assert.step('GetUser is called');

      let normalizedBody = assign({}, body);

      assert.deepEqual(
        normalizedBody,
        {
          AccessToken: accessToken
        },
        'correct body is sent'
      );

      return {
        UserAttributes: [
          { Name: 'sub', Value: 'TEST-USER-ID' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'johnwick@fabscale.com' }
        ],
        Username: 'TEST-USER-ID'
      };
    };

    await visit('/reset-password');

    await fillIn(
      '[data-test-reset-password-username]',
      'johnwick@fabscale.com'
    );
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
      .hasText('Reset password for: johnwick@fabscale.com');

    // Now actually reset the password
    await fillIn('[data-test-reset-password-verification-code]', '123456');
    await fillIn('[data-test-reset-password-new-password]', 'test1234');
    await click('[data-test-reset-password-submit]');

    assert.ok(cognito.isAuthenticated, 'user is authenticated now');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      accessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps([
      'ConfirmForgotPassword is called',
      'InitiateAuth is called',
      'RespondToAuthChallenge is called',
      'GetUser is called'
    ]);
  });

  test('it allows to resend a code & reset the password', async function(assert) {
    let { cognito } = this;

    let accessToken = createJWTToken();

    this.awsHooks['AWSCognitoIdentityProviderService.ForgotPassword'] = () => {
      assert.step('ForgotPassword is called');

      return {
        CodeDeliveryDetails: {
          AttributeName: 'email',
          DeliveryMedium: 'EMAIL',
          Destination: 'j***@f***.com'
        }
      };
    };

    this.awsHooks[
      'AWSCognitoIdentityProviderService.ConfirmForgotPassword'
    ] = () => {
      assert.step('ConfirmForgotPassword is called');

      return {};
    };

    this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
      assert.step('InitiateAuth is called');

      return {
        ChallengeName: 'PASSWORD_VERIFIER',
        ChallengeParameters: {
          SALT: 'TEST-SALT',
          SECRET_BLOCK: 'TEST-SECRET-BLOCK',
          USERNAME: 'TEST-USER-ID',
          USER_ID_FOR_SRP: 'TEST-USER-ID'
        }
      };
    };

    this.awsHooks[
      'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
    ] = () => {
      assert.step('RespondToAuthChallenge is called');

      return {
        AuthenticationResult: {
          AccessToken: accessToken,
          ExpiresIn: 3600,
          IdToken: createJWTToken(),
          RefreshToken: createJWTToken(),
          TokenType: 'Bearer'
        },
        ChallengeParameters: {}
      };
    };

    this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
      assert.step('GetUser is called');

      return {
        UserAttributes: [
          { Name: 'sub', Value: 'TEST-USER-ID' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'johnwick@fabscale.com' }
        ],
        Username: 'TEST-USER-ID'
      };
    };

    await visit('/reset-password');

    await fillIn(
      '[data-test-reset-password-username]',
      'johnwick@fabscale.com'
    );
    await click('[data-test-reset-password-skip-send-verification-code]');
    await click('[data-test-reset-password-resend-verification-code]');

    assert
      .dom('[data-test-reset-password-username]')
      .hasValue('johnwick@fabscale.com');

    await click('[data-test-reset-password-send-verification-code]');
    await settled();

    assert.dom('[data-test-reset-password-username]').doesNotExist();
    assert
      .dom('[data-test-reset-password-send-verification-code]')
      .doesNotExist();
    assert
      .dom('[data-test-reset-password-skip-send-verification-code]')
      .doesNotExist();
    assert
      .dom('[data-test-reset-password-username-info]')
      .hasText('Reset password for: johnwick@fabscale.com');

    // Now actually reset the password
    await fillIn('[data-test-reset-password-verification-code]', '123456');
    await fillIn('[data-test-reset-password-new-password]', 'test1234');
    await click('[data-test-reset-password-submit]');

    assert.ok(cognito.isAuthenticated, 'user is authenticated now');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      accessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps([
      'ForgotPassword is called',
      'ConfirmForgotPassword is called',
      'InitiateAuth is called',
      'RespondToAuthChallenge is called',
      'GetUser is called'
    ]);
  });

  module('query params', function(hooks) {
    hooks.beforeEach(function() {
      let accessToken = createJWTToken();

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ForgotPassword'
      ] = () => {
        return {
          CodeDeliveryDetails: {
            AttributeName: 'email',
            DeliveryMedium: 'EMAIL',
            Destination: 'j***@f***.com'
          }
        };
      };

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ConfirmForgotPassword'
      ] = () => {
        return {};
      };

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
        return {
          ChallengeName: 'PASSWORD_VERIFIER',
          ChallengeParameters: {
            SALT: 'TEST-SALT',
            SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            USERNAME: 'TEST-USER-ID',
            USER_ID_FOR_SRP: 'TEST-USER-ID'
          }
        };
      };

      this.awsHooks[
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
      ] = () => {
        return {
          AuthenticationResult: {
            AccessToken: accessToken,
            ExpiresIn: 3600,
            IdToken: createJWTToken(),
            RefreshToken: createJWTToken(),
            TokenType: 'Bearer'
          },
          ChallengeParameters: {}
        };
      };

      this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
        return {
          UserAttributes: [
            { Name: 'sub', Value: 'TEST-USER-ID' },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'email', Value: 'johnwick@fabscale.com' }
          ],
          Username: 'TEST-USER-ID'
        };
      };

      this.accessToken = accessToken;
    });

    test('it allows to set a username via the URL', async function(assert) {
      let { cognito, accessToken } = this;

      await visit('/reset-password?username=johnwick@fabscale.com');

      assert.dom('[data-test-reset-password-username]').doesNotExist();
      assert
        .dom('[data-test-reset-password-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-skip-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-username-info]')
        .hasText('Reset password for: johnwick@fabscale.com');

      // Now actually reset the password
      await fillIn('[data-test-reset-password-verification-code]', '123456');
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        accessToken,
        'correct jwtToken is set on service'
      );
    });

    test('it allows to set username & verificationCode via the URL', async function(assert) {
      let { cognito, accessToken } = this;

      await visit(
        '/reset-password?username=johnwick@fabscale.com&verificationCode=123456'
      );

      assert.dom('[data-test-reset-password-username]').doesNotExist();
      assert
        .dom('[data-test-reset-password-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-skip-send-verification-code]')
        .doesNotExist();
      assert
        .dom('[data-test-reset-password-username-info]')
        .hasText('Reset password for: johnwick@fabscale.com');
      assert
        .dom('[data-test-reset-password-verification-code]')
        .hasValue('123456');

      // Now actually reset the password
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        accessToken,
        'correct jwtToken is set on service'
      );
    });

    test('it allows to set verificationCode via the URL', async function(assert) {
      let { cognito, accessToken } = this;

      await visit('/reset-password?verificationCode=123456');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
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
        .hasText('Reset password for: johnwick@fabscale.com');
      assert
        .dom('[data-test-reset-password-verification-code]')
        .hasValue('123456');

      // Now actually reset the password
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        accessToken,
        'correct jwtToken is set on service'
      );
    });
  });

  module('errors', function(hooks) {
    hooks.beforeEach(function() {
      setupOnerror((error) => {
        // ignore cognito errors, as they are handled in the UI
        if (error instanceof CognitoError) {
          return;
        }
        throw error;
      });
    });

    hooks.afterEach(function() {
      resetOnerror();
    });

    test('it handles errors when trying to generate a code', async function(assert) {
      let { cognito } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ForgotPassword'
      ] = () => {
        assert.step('ForgotPassword is called');

        return [
          400,
          {},
          {
            __type: 'UserNotFoundException',
            message: 'Username/client id combination not found.'
          }
        ];
      };

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-send-verification-code]');
      await settled();

      assert.equal(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('This user does not exist.');

      assert.verifySteps(['ForgotPassword is called']);
    });

    test('it handles an invalid verification code', async function(assert) {
      let { cognito } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ConfirmForgotPassword'
      ] = () => {
        assert.step('ConfirmForgotPassword is called');

        return [
          400,
          {},
          {
            __type: 'ExpiredCodeException',
            message: 'Invalid code provided, please request a code again.'
          }
        ];
      };

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', '123456');
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.equal(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('Invalid verification code provided, please try again.');

      assert.verifySteps(['ConfirmForgotPassword is called']);
    });

    test('it handles an invalid new password', async function(assert) {
      let { cognito } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ConfirmForgotPassword'
      ] = () => {
        assert.step('ConfirmForgotPassword is called');

        return [
          400,
          {},
          {
            __type: 'InvalidPasswordException',
            message:
              'Password does not conform to policy: Password not long enough'
          }
        ];
      };

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', '123456');
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.equal(
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

      assert.verifySteps(['ConfirmForgotPassword is called']);
    });

    // TODO FN: Maybe this can be handled more gracefully (although it is rather an edge case...)
    test('it handles an error during authentication (after password reset)', async function(assert) {
      let { cognito } = this;

      this.awsHooks[
        'AWSCognitoIdentityProviderService.ConfirmForgotPassword'
      ] = () => {
        assert.step('ConfirmForgotPassword is called');

        return {};
      };

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
        assert.step('InitiateAuth is called');

        return {
          ChallengeName: 'PASSWORD_VERIFIER',
          ChallengeParameters: {
            SALT: 'TEST-SALT',
            SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            USERNAME: 'TEST-USER-ID',
            USER_ID_FOR_SRP: 'TEST-USER-ID'
          }
        };
      };

      this.awsHooks[
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
      ] = () => {
        assert.step('RespondToAuthChallenge is called');

        return [
          400,
          {},
          {
            __type: 'NotAuthorizedException',
            message: 'Incorrect username or password.'
          }
        ];
      };

      await visit('/reset-password');

      await fillIn(
        '[data-test-reset-password-username]',
        'johnwick@fabscale.com'
      );
      await click('[data-test-reset-password-skip-send-verification-code]');
      await fillIn('[data-test-reset-password-verification-code]', '123456');
      await fillIn('[data-test-reset-password-new-password]', 'test1234');
      await click('[data-test-reset-password-submit]');

      assert.equal(
        currentRouteName(),
        'reset-password',
        'user is still on reset-password page'
      );
      assert.notOk(cognito.isAuthenticated, 'user is not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The password you provided is incorrect.');

      assert.verifySteps([
        'ConfirmForgotPassword is called',
        'InitiateAuth is called',
        'RespondToAuthChallenge is called'
      ]);
    });
  });
});
