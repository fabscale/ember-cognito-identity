import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser } from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function updateResetPassword(
  cognitoUser: CognitoUser,
  {
    code,
    newPassword,
  }: {
    code: string;
    newPassword: string;
  }
): Promise<void> {
  let promise: Promise<void> = new RSVPPromise((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess() {
        resolve();
      },

      onFailure(error: AmazonCognitoIdentityJsError) {
        // This can also happen, e.g. if the password is shorter than 6 characters
        if (error.code === 'InvalidParameterException') {
          error.code = 'InvalidPasswordException';
          error.name = 'InvalidPasswordException';
        }

        reject(dispatchError(error));
      },
    });
  });

  return waitForPromise(promise);
}
