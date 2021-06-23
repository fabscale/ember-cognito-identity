import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function updatePassword(
  cognitoUser: CognitoUser,
  {
    oldPassword,
    newPassword,
  }: {
    oldPassword: string;
    newPassword: string;
  }
): Promise<void> {
  let promise: Promise<void> = new RSVPPromise((resolve, reject) => {
    cognitoUser.changePassword(oldPassword, newPassword, function (error) {
      if (error) {
        reject(dispatchError(error));
        return;
      }

      resolve();
    });
  });

  return waitForPromise(promise);
}
