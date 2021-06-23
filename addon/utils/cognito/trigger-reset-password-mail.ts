import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function triggerResetPasswordMail(
  cognitoUser: CognitoUser
): Promise<void> {
  let promise = new RSVPPromise<void>((resolve, reject) => {
    cognitoUser.forgotPassword({
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
