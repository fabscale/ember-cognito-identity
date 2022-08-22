import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';

export function getUserSession(
  cognitoUser: CognitoUser
): Promise<CognitoUserSession> {
  let promise = new Promise<CognitoUserSession>((resolve, reject) => {
    cognitoUser.getSession(
      (
        error: AmazonCognitoIdentityJsError | null,
        cognitoUserSession: CognitoUserSession
      ) => {
        if (error) {
          return reject(dispatchError(error));
        }

        resolve(cognitoUserSession);
      },
      {
        clientMetadata: {},
      }
    );
  });

  return waitForPromise(promise);
}
