import {
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { CognitoNotAuthenticatedError } from 'ember-cognito-identity/errors/cognito';
import {
  CognitoData,
  UserAttributes,
} from 'ember-cognito-identity/services/cognito';
import { CognitoUserMfa } from './cognito-mfa';
import { getUserSession } from './cognito/get-user-session';
import { getUserAttributes } from './get-user-attributes';

export async function loadUserDataAndAccessToken(
  userPool: CognitoUserPool
): Promise<CognitoData> {
  let cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser) {
    throw new CognitoNotAuthenticatedError();
  }

  let cognitoUserSession: CognitoUserSession, userAttributes: UserAttributes;

  try {
    cognitoUserSession = await getUserSession(cognitoUser);
    userAttributes = await getUserAttributes(cognitoUser);
  } catch (error) {
    cognitoUser.signOut();
    throw error;
  }

  let jwtToken = cognitoUserSession.getAccessToken().getJwtToken();

  let cognitoData: CognitoData = {
    cognitoUser,
    userAttributes,
    cognitoUserSession,
    jwtToken,
    getAccessToken: () => cognitoUserSession.getAccessToken(),
    getIdToken: () => cognitoUserSession.getIdToken(),
    mfa: new CognitoUserMfa(cognitoUser),
  };

  return cognitoData;
}
