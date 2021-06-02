import { createJWTToken } from 'ember-cognito-identity/test-support/helpers/create-jwt-token';

export function setupPretenderSuccessfulLogin(
  context,
  {
    username = 'johnwick@thecontinental.assassins',
    userId = 'TEST-USER-ID',
  } = {}
) {
  context.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
    return {
      ChallengeName: 'PASSWORD_VERIFIER',
      ChallengeParameters: {
        SALT: 'TEST-SALT',
        SECRET_BLOCK: 'TEST-SECRET-BLOCK',
        USERNAME: userId,
        USER_ID_FOR_SRP: userId,
      },
    };
  };

  let accessToken = createJWTToken();

  context.awsHooks['AWSCognitoIdentityProviderService.RespondToAuthChallenge'] =
    () => {
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

  context.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
    return {
      UserAttributes: [
        { Name: 'sub', Value: userId },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'email', Value: username },
      ],

      Username: userId,
    };
  };

  context.cognitoAccessToken = accessToken;
}

export function setupPretenderInvalidPassword(context) {
  context.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
    return [
      400,
      {},
      {
        __type: 'NotAuthorizedException',
        message: 'Incorrect username or password.',
      },
    ];
  };
}

export function setupPretenderNeedsInitialPassword(
  context,
  {
    username = 'johnwick@thecontinental.assassins',
    userId = 'TEST-USER-ID',
  } = {}
) {
  let accessToken = createJWTToken();
  context.cognitoAccessToken = accessToken;

  context.awsHooks['AWSCognitoIdentityProviderService.InitiateAuth'] = () => {
    return {
      ChallengeName: 'PASSWORD_VERIFIER',
      ChallengeParameters: {
        SALT: 'TEST-SALT',
        SECRET_BLOCK: 'TEST-SECRET-BLOCK',
        USERNAME: userId,
        USER_ID_FOR_SRP: userId,
      },
    };
  };

  // This API request is made 4 times with different responses
  let respondToAuthChallengeList = [
    () => {
      return {
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeParameters: {
          requiredAttributes: '[]',
          userAttributes:
            '{"email_verified":"true","email":"johnwick@thecontinental.assassins"}',
        },

        Session: 'TEST-SESSION-ID',
      };
    },
    () => {
      return {
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeParameters: {
          requiredAttributes: '[]',
          userAttributes: `{"email_verified":"true","email":"${username}"}'`,
        },

        Session: 'TEST-SESSION-ID',
      };
    },
    () => {
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
    () => {
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

  context.awsHooks['AWSCognitoIdentityProviderService.RespondToAuthChallenge'] =
    (body) => {
      let nextStep = respondToAuthChallengeList.shift();
      return nextStep(body);
    };

  context.awsHooks['AWSCognitoIdentityProviderService.GetUser'] = () => {
    return {
      UserAttributes: [
        { Name: 'sub', Value: userId },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'email', Value: username },
      ],

      Username: userId,
    };
  };
}
