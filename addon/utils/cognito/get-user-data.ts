import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser, UserData } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function getUserData(
  cognitoUser: CognitoUser,
  { forceReload = false } = {}
): Promise<UserData> {
  let promise: Promise<UserData> = new Promise((resolve, reject) => {
    cognitoUser.getUserData(
      (error, userData) => {
        if (error) {
          return reject(dispatchError(error));
        }

        resolve(userData!);
      },
      { bypassCache: forceReload }
    );
  });

  return waitForPromise(promise);
}
