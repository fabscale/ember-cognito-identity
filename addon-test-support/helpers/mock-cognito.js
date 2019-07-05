import { set } from '@ember/object';

export function mockCognito(
  context,
  {
    accessToken = 'TEST-ACCESS-TOKEN-AUTO',
    username = 'johnwick@thecontential.assassins'
  } = {}
) {
  let cognito = context.owner.lookup('service:cognito');

  let cognitoUser = {
    signOut: () => {
      // noop
    }
  };
  let cognitoUserSession = {};
  let userAttributes = {
    email: username,
    email_verified: 'true'
  };

  let cognitoData = {
    cognitoUser,
    cognitoUserSession,
    userAttributes,
    jwtToken: accessToken
  };

  set(cognito, 'cognitoData', cognitoData);
}

export default mockCognito;
