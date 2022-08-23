import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function triggerResetPasswordMail(
  cognitoUser: CognitoUser
): Promise<void> {
  let promise = new Promise<void>((resolve, reject) => {
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
