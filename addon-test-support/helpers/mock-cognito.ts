export function mockCognito(
  context: any,
  {
    accessToken = 'TEST-ACCESS-TOKEN-AUTO',
    username = 'johnwick@thecontential.assassins',
  } = {}
) {
  let cognito = context.owner.lookup('service:cognito');

  let cognitoUser = {
    signOut: () => {
      // noop
    },
  };
  let cognitoUserSession = {};
  /* eslint-disable camelcase */
  let userAttributes = {
    email: username,
    email_verified: 'true',
  };
  /* eslint-enable camelcase */

  let cognitoData = {
    cognitoUser,
    cognitoUserSession,
    userAttributes,
    jwtToken: accessToken,
  };

  cognito.cognitoData = cognitoData;
}

export default mockCognito;
