import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function verifySoftwareToken(
  cognitoUser: CognitoUser,
  challengeAnswer: string,
  deviceName = 'MFA Device'
): Promise<void> {
  let promise = new Promise<void>((resolve, reject) => {
    cognitoUser.verifySoftwareToken(challengeAnswer, deviceName, {
      onSuccess() {
        resolve();
      },

      onFailure(error) {
        reject(dispatchError(error));
      },
    });
  });

  return waitForPromise(promise);
}
