import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

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
  let promise = new Promise<void>((resolve, reject) => {
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
