import { mockCognitoData } from './mock-cognito-data';

export function mockCognito(
  context: any,
  {
    accessToken = 'TEST-ACCESS-TOKEN-AUTO',
    username = 'johnwick@thecontential.assassins',
  } = {}
) {
  let cognito = context.owner.lookup('service:cognito');

  cognito.cognitoData = mockCognitoData({ accessToken, username });
}

export default mockCognito;
