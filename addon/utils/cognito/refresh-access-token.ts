import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export async function refreshAccessToken(
  cognitoUserSession: CognitoUserSession,
  cognitoUser: CognitoUser
): Promise<void> {
  // Note: @types/amazon-cognito-auth-js is incorrectly missing this
  // @ts-ignore next-line
  let { refreshToken } = cognitoUserSession;

  if (!refreshToken || !refreshToken.getToken()) {
    throw new Error('Cannot retrieve a refresh token');
  }

  let promise = new Promise<void>((resolve, reject) => {
    cognitoUser.refreshSession(refreshToken, (error) => {
      if (error) {
        reject(dispatchError(error));
        return;
      }

      resolve();
    });
  });

  return waitForPromise(promise);
}
