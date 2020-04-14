import { module, test } from 'qunit';
import {
  visit,
  fillIn,
  click,
  settled,
  resetOnerror,
  setupOnerror,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { assign } from '@ember/polyfills';
import { createJWTToken } from 'ember-cognito-identity/test-support/helpers/create-jwt-token';
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';
import { CognitoError } from 'ember-cognito-identity/errors/cognito';

module('Acceptance | login', function (hooks) {
  setupApplicationTest(hooks);
  setupCognitoMocks(hooks);

  test('it works with correct username & password', async function (assert) {
    let { cognito } = this;

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
            SRP_A: 'TEST-SRP-A',
          },

          ClientMetadata: {},
        },
        'correct body is sent'
      );

      return {
        ChallengeName: 'PASSWORD_VERIFIER',
        ChallengeParameters: {
          SALT: 'TEST-SALT',
          SECRET_BLOCK: 'TEST-SECRET-BLOCK',
          USERNAME: 'TEST-USER-ID',
          USER_ID_FOR_SRP: 'TEST-USER-ID',
        },
      };
    };

    let accessToken = createJWTToken();

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
            PASSWORD_CLAIM_SIGNATURE: 'TEST-CLAIM-SIGNATURE',
          },

          ClientMetadata: {},
        },
        'correct body is sent'
      );

      return {
        AuthenticationResult: {
          AccessToken: accessToken,
          ExpiresIn: 3600,
          IdToken: createJWTToken(),
          RefreshToken: createJWTToken(),
          TokenType: 'Bearer',
        },

        ChallengeParameters: {},
      };
    };

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
          { Name: 'sub', Value: 'TEST-USER-ID' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'email', Value: 'johnwick@fabscale.com' },
        ],

        Username: 'TEST-USER-ID',
      };
    };

    await visit('/login');

    assert.notOk(
      cognito.isAuthenticated,
      'user is not authenticated initially'
    );

    await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
    await fillIn('[data-test-login-form-password]', 'test1234');
    await click('[data-test-login-form-submit]');

    await settled();

    assert.ok(cognito.isAuthenticated, 'user is authenticated now');
    assert.equal(
      cognito.cognitoData && cognito.cognitoData.jwtToken,
      accessToken,
      'correct jwtToken is set on service'
    );

    assert.verifySteps([
      'InitiateAuth is called',
      'RespondToAuthChallenge is called',
      'GetUser is called',
    ]);
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

    test('it handles an unknown username', async function (assert) {
      let { cognito } = this;

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
        assert.step('InitiateAuth is called');

        return [
          400,
          {},
          { __type: 'UserNotFoundException', message: 'User does not exist.' },
        ];
      };

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('This user does not exist.');

      assert.verifySteps(['InitiateAuth is called']);
    });

    test('it handles an incorrect password', async function (assert) {
      let { cognito } = this;

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
        assert.step('InitiateAuth is called');

        return [
          400,
          {},
          {
            __type: 'NotAuthorizedException',
            message: 'Incorrect username or password.',
          },
        ];
      };

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('The password you provided is incorrect.');

      assert.verifySteps(['InitiateAuth is called']);
    });

    test('it handles a user that needs to set an initial password', async function (assert) {
      let { cognito } = this;

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
              SRP_A: 'TEST-SRP-A',
            },

            ClientMetadata: {},
          },
          'correct body is sent'
        );

        return {
          ChallengeName: 'PASSWORD_VERIFIER',
          ChallengeParameters: {
            SALT: 'TEST-SALT',
            SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            USERNAME: 'TEST-USER-ID',
            USER_ID_FOR_SRP: 'TEST-USER-ID',
          },
        };
      };

      let accessToken = createJWTToken();

      // This API request is made 4 times with different responses
      let respondToAuthChallengeList = [
        (body) => {
          assert.step('RespondToAuthChallenge (1) is called');

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
                PASSWORD_CLAIM_SIGNATURE: 'TEST-CLAIM-SIGNATURE',
              },

              ClientMetadata: {},
            },
            'correct body is sent'
          );

          return {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ChallengeParameters: {
              requiredAttributes: '[]',
              userAttributes: '{}',
            },

            Session: 'TEST-SESSION-ID',
          };
        },
        (body) => {
          assert.step('RespondToAuthChallenge (2) is called');

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
                PASSWORD_CLAIM_SIGNATURE: 'TEST-CLAIM-SIGNATURE',
              },

              ClientMetadata: {},
            },
            'correct body is sent'
          );

          return {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ChallengeParameters: {
              requiredAttributes: '[]',
              userAttributes: '{}',
            },

            Session: 'TEST-SESSION-ID',
          };
        },
        (body) => {
          assert.step('RespondToAuthChallenge (3) is called');

          let normalizedBody = assign({}, body);

          assert.deepEqual(
            normalizedBody,
            {
              ChallengeName: 'NEW_PASSWORD_REQUIRED',
              ClientId: 'TEST-CLIENT-ID',
              ChallengeResponses: {
                NEW_PASSWORD: 'test1234-NEW',
                USERNAME: 'TEST-USER-ID',
              },

              Session: 'TEST-SESSION-ID',
            },
            'correct body is sent'
          );

          return {
            AuthenticationResult: {
              AccessToken: accessToken,
              ExpiresIn: 3600,
              IdToken: accessToken,
              RefreshToken: accessToken,
              TokenType: 'Bearer',
            },

            ChallengeParameters: {},
          };
        },
        (body) => {
          assert.step('RespondToAuthChallenge (4) is called');

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
                PASSWORD_CLAIM_SIGNATURE: 'TEST-CLAIM-SIGNATURE',
              },

              ClientMetadata: {},
            },
            'correct body is sent'
          );

          return {
            AuthenticationResult: {
              AccessToken: accessToken,
              ExpiresIn: 3600,
              IdToken: createJWTToken(),
              RefreshToken: createJWTToken(),
              TokenType: 'Bearer',
            },

            ChallengeParameters: {},
          };
        },
      ];

      this.awsHooks[
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
      ] = (body) => {
        let nextStep = respondToAuthChallengeList.shift();
        return nextStep(body);
      };

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
            { Name: 'sub', Value: 'TEST-USER-ID' },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'email', Value: 'johnwick@fabscale.com' },
          ],

          Username: 'TEST-USER-ID',
        };
      };

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');
      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter new password');
      assert.dom('[data-test-login-form-new-password]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-new-password]', 'test1234-NEW');
      await click('[data-test-login-form-submit]');
      await settled();

      assert.ok(cognito.isAuthenticated, 'user is authenticated now');
      assert.equal(
        cognito.cognitoData && cognito.cognitoData.jwtToken,
        accessToken,
        'correct jwtToken is set on service'
      );

      assert.verifySteps([
        'enter username and password',
        'InitiateAuth is called',
        'RespondToAuthChallenge (1) is called',
        'enter new password',
        'InitiateAuth is called',
        'RespondToAuthChallenge (2) is called',
        'RespondToAuthChallenge (3) is called',
        'InitiateAuth is called',
        'RespondToAuthChallenge (4) is called',
        'GetUser is called',
      ]);
    });

    test('it handles the user trying to set an invalid initial password', async function (assert) {
      let { cognito } = this;

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
              SRP_A: 'TEST-SRP-A',
            },

            ClientMetadata: {},
          },
          'correct body is sent'
        );

        return {
          ChallengeName: 'PASSWORD_VERIFIER',
          ChallengeParameters: {
            SALT: 'TEST-SALT',
            SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            USERNAME: 'TEST-USER-ID',
            USER_ID_FOR_SRP: 'TEST-USER-ID',
          },
        };
      };

      // This API request is made 4 times with different responses
      let respondToAuthChallengeList = [
        () => {
          assert.step('RespondToAuthChallenge (1) is called');

          return {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ChallengeParameters: {
              requiredAttributes: '[]',
              userAttributes:
                '{"email_verified":"true","email":"johnwick@fabscale.com"}',
            },

            Session: 'TEST-SESSION-ID',
          };
        },
        () => {
          assert.step('RespondToAuthChallenge (2) is called');

          return {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ChallengeParameters: {
              requiredAttributes: '[]',
              userAttributes:
                '{"email_verified":"true","email":"johnwick@fabscale.com"}',
            },

            Session: 'TEST-SESSION-ID',
          };
        },
        () => {
          assert.step('RespondToAuthChallenge (3) is called');

          return [
            400,
            {},
            {
              __type: 'InvalidPasswordException',
              message:
                'Password does not conform to policy: Password not long enough',
            },
          ];
        },
      ];

      this.awsHooks[
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
      ] = (body) => {
        let nextStep = respondToAuthChallengeList.shift();
        return nextStep(body);
      };

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      assert.dom('[data-test-login-form-new-password]').doesNotExist();
      assert.step('enter username and password');

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');
      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');

      assert.step('enter new password');
      assert.dom('[data-test-login-form-new-password]').exists();
      assert.dom('[data-test-login-form-username]').isDisabled();
      assert.dom('[data-test-login-form-password]').isDisabled();

      await fillIn('[data-test-login-form-new-password]', 'test1234-NEW');
      await click('[data-test-login-form-submit]');
      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText(
          'Password does not conform to policy: Password not long enough'
        );

      assert.verifySteps([
        'enter username and password',
        'InitiateAuth is called',
        'RespondToAuthChallenge (1) is called',
        'enter new password',
        'InitiateAuth is called',
        'RespondToAuthChallenge (2) is called',
        'RespondToAuthChallenge (3) is called',
      ]);
    });

    test('it handles an API error when fetching user attributes', async function (assert) {
      let { cognito } = this;

      this.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
        assert.step('InitiateAuth is called');

        return {
          ChallengeName: 'PASSWORD_VERIFIER',
          ChallengeParameters: {
            SALT: 'TEST-SALT',
            SECRET_BLOCK: 'TEST-SECRET-BLOCK',
            USERNAME: 'TEST-USER-ID',
            USER_ID_FOR_SRP: 'TEST-USER-ID',
          },
        };
      };

      this.awsHooks[
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
      ] = () => {
        assert.step('RespondToAuthChallenge is called');

        return {
          AuthenticationResult: {
            AccessToken: createJWTToken(),
            ExpiresIn: 3600,
            IdToken: createJWTToken(),
            RefreshToken: createJWTToken(),
            TokenType: 'Bearer',
          },

          ChallengeParameters: {},
        };
      };

      this.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
        assert.step('GetUser is called');

        return [
          400,
          {},
          { __type: 'UserNotFoundException', message: 'User does not exist.' },
        ];
      };

      await visit('/login');

      assert.notOk(
        cognito.isAuthenticated,
        'user is not authenticated initially'
      );

      await fillIn('[data-test-login-form-username]', 'johnwick@fabscale.com');
      await fillIn('[data-test-login-form-password]', 'test1234');
      await click('[data-test-login-form-submit]');

      await settled();

      assert.notOk(cognito.isAuthenticated, 'user is still not authenticated');
      assert
        .dom('[data-test-cognito-error]')
        .hasText('This user does not exist.');

      assert.verifySteps([
        'InitiateAuth is called',
        'RespondToAuthChallenge is called',
        'GetUser is called',
      ]);
    });
  });
});
