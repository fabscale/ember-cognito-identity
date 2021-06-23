import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function associateSoftwareToken(
  cognitoUser: CognitoUser
): Promise<string> {
  let promise = new RSVPPromise<string>((resolve, reject) => {
    cognitoUser.associateSoftwareToken({
      associateSecretCode(secretCode: string) {
        resolve(secretCode);
      },

      onFailure(error) {
        reject(dispatchError(error));
      },
    });
  });

  return waitForPromise(promise);
}
