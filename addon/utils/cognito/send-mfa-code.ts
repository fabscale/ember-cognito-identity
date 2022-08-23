import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function sendMfaCode(
  cognitoUser: CognitoUser,
  code: string
): Promise<void> {
  let promise = new Promise<void>((resolve, reject) => {
    cognitoUser.sendMFACode(
      code,
      {
        onSuccess() {
          resolve();
        },

        onFailure(error) {
          reject(dispatchError(error));
        },
      },
      'SOFTWARE_TOKEN_MFA'
    );
  });

  return waitForPromise(promise);
}
