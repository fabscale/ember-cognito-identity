import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function verifySoftwareToken(
  cognitoUser: CognitoUser,
  challengeAnswer: string,
  deviceName = 'MFA Device'
): Promise<void> {
  let promise = new RSVPPromise<void>((resolve, reject) => {
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
