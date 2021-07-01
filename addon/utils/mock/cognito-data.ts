import { getOwnConfig, macroCondition } from '@embroider/macros';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { CognitoData } from 'ember-cognito-identity/services/cognito';
import { CognitoUserMfa } from '../cognito-mfa';
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
} = {}): CognitoData | undefined {
  if (macroCondition(!getOwnConfig<any>()?.enableMocks)) {
    return undefined;
  }

  let cognitoUserSession = mockCognitoUserSession({ jwtToken })!;
  let cognitoUser = mockCognitoUser({
    username,
    cognitoUserSession,
    mfaEnabled,
    assert,
  })!;

  let mfa = new CognitoUserMfa(cognitoUser as unknown as CognitoUser);

  /* eslint-disable camelcase */
  let userAttributes = {
    email: username,
    email_verified: 'true',
  };
  /* eslint-enable camelcase */

  let cognitoData: unknown = {
    cognitoUser,
    cognitoUserSession,
    userAttributes,
    jwtToken,
    mfa,
  };

  return cognitoData as CognitoData;
}
