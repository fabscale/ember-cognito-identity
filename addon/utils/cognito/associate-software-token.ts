import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function associateSoftwareToken(
  cognitoUser: CognitoUser
): Promise<string> {
  let promise = new Promise<string>((resolve, reject) => {
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
