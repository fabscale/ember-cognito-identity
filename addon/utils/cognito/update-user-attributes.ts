import { waitForPromise } from '@ember/test-waiters';
import {
  CognitoUser,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

export function updateUserAttributes(
  cognitoUser: CognitoUser,
  attributeList: ICognitoUserAttributeData[]
) {
  let promise = new RSVPPromise((resolve, reject) => {
    cognitoUser.updateAttributes(
      attributeList,
      (error: AmazonCognitoIdentityJsError) => {
        if (error) {
          reject(dispatchError(error));
          return;
        }

        resolve();
      }
    );
  });

  return waitForPromise(promise);
}
