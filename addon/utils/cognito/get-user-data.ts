import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser, UserData } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function getUserData(
  cognitoUser: CognitoUser,
  { forceReload = false } = {}
): Promise<UserData> {
  let promise = new RSVPPromise<UserData>((resolve, reject) => {
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
