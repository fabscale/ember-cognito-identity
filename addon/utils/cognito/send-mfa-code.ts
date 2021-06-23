import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function sendMfaCode(
  cognitoUser: CognitoUser,
  code: string
): Promise<void> {
  let promise = new RSVPPromise<void>((resolve, reject) => {
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
