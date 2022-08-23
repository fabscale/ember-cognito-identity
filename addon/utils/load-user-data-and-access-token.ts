import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { CognitoNotAuthenticatedError } from 'ember-cognito-identity/errors/cognito';
import { UserAttributes } from 'ember-cognito-identity/services/cognito';
import { getUserSession } from './cognito/get-user-session';
import { getUserAttributes } from './get-user-attributes';

export interface CognitoData {
  cognitoUser: CognitoUser;
  cognitoUserSession: CognitoUserSession;
  userAttributes: { [key: string]: any };
}

export async function reloadUserSession(
  cognitoUser: CognitoUser
): Promise<CognitoUserSession> {
  if (!cognitoUser) {
    throw new CognitoNotAuthenticatedError();
  }

  try {
    return await getUserSession(cognitoUser);
  } catch (error) {
    cognitoUser.signOut();
    throw error;
  }
}

export async function loadUserFromUserPool(
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

  return {
    cognitoUser,
    userAttributes,
    cognitoUserSession,
  };
}
