import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { dispatchError } from 'ember-cognito-identity/errors/cognito';

export function setUserMfaPreference(
  cognitoUser: CognitoUser,
  enable = true
): Promise<void> {
  let promise = new Promise<void>((resolve, reject) => {
    let totpMfaSettings = {
      PreferredMfa: enable,
      Enabled: enable,
    };

    cognitoUser.setUserMfaPreference(null, totpMfaSettings, (err) => {
      if (err) {
        return reject(dispatchError(err));
      }

      resolve();
    });
  });

  return waitForPromise(promise);
}
