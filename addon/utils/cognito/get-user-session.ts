import { waitForPromise } from '@ember/test-waiters';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function getUserSession(
  cognitoUser: CognitoUser
): Promise<CognitoUserSession> {
  let promise: Promise<CognitoUserSession> = new RSVPPromise(
    (resolve, reject) => {
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
    }
  );

  return waitForPromise(promise);
}
