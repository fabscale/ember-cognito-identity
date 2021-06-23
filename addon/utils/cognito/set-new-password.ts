import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function setNewPassword(
  cognitoUser: CognitoUser,
  { newPassword }: { newPassword: string },
  newAttributes = {}
): Promise<void> {
  let promise: Promise<void> = new RSVPPromise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, newAttributes, {
      onSuccess() {
        resolve();
      },

      onFailure(err) {
        reject(dispatchError(err));
      },
    });
  });

  return waitForPromise(promise);
}
