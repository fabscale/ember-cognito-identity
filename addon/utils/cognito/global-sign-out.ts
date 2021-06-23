import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function globalSignOut(cognitoUser: CognitoUser): Promise<void> {
  let promise: Promise<void> = new RSVPPromise((resolve, reject) => {
    cognitoUser.globalSignOut({
      onSuccess: () => {
        resolve();
      },

      onFailure(err) {
        reject(dispatchError(err));
      },
    });
  });

  return waitForPromise(promise);
}
