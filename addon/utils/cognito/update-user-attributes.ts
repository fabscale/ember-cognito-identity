import { waitForPromise } from '@ember/test-waiters';
import {
  CognitoUser,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';

export function updateUserAttributes(
  cognitoUser: CognitoUser,
  attributeList: ICognitoUserAttributeData[]
): Promise<void> {
  let promise = new Promise<void>((resolve, reject) => {
    cognitoUser.updateAttributes(attributeList, (error: unknown) => {
      if (error) {
        reject(dispatchError(error as AmazonCognitoIdentityJsError));
        return;
      }

      resolve();
    });
  });

  return waitForPromise(promise);
}
