import { getOwnConfig, macroCondition } from '@embroider/macros';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoAuthenticatedUser } from '../cognito-authenticated-user';
import { CognitoSession } from '../cognito-session';
import { mockCognitoUser } from './cognito-user';
import { mockCognitoUserSession } from './cognito-user-session';

export function mockCognitoData({
  jwtToken = getOwnConfig<any>().mockJwtToken,
  username = getOwnConfig<any>().mockUsername,
  mfaEnabled = false,
  assert,
}: {
  jwtToken?: string;
  username?: string;
  mfaEnabled?: boolean;
  assert?: any;
} = {}):
  | { session: CognitoSession; user: CognitoAuthenticatedUser }
  | undefined {
  if (macroCondition(!getOwnConfig<any>()?.enableMocks)) {
    return undefined;
  }

  let cognitoUserSession = mockCognitoUserSession({
    jwtToken,
  }) as unknown as CognitoUserSession;

  let cognitoUser = mockCognitoUser({
    username,
    cognitoUserSession,
    mfaEnabled,
    assert,
  }) as unknown as CognitoUser;

  /* eslint-disable camelcase */
  let userAttributes = {
    email: username,
    email_verified: 'true',
  };
  /* eslint-enable camelcase */

  let session = new CognitoSession(cognitoUser, cognitoUserSession);
  let user = new CognitoAuthenticatedUser(cognitoUser, userAttributes);

  return { session, user };
}
