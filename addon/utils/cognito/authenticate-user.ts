import { waitForPromise } from '@ember/test-waiters';
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import {
  dispatchError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import { Promise as RSVPPromise } from 'rsvp';

/*
    Might reject with:
    * InvalidAuthorizationError (username/password wrong)
    * NewPasswordRequiredError (new user)
    * PasswordResetRequiredError (password reset required by admin)
   */
export function authenticateUser(
  cognitoUser: CognitoUser,
  {
    username,
    password,
  }: {
    username: string;
    password: string;
  }
): Promise<CognitoUser> {
  let authenticationData = {
    Username: username,
    Password: password,
  };
  let authenticationDetails = new AuthenticationDetails(authenticationData);

  let promise = new RSVPPromise<CognitoUser>((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess() {
        resolve(cognitoUser);
      },

      newPasswordRequired(userAttributes, requiredAttributes) {
        reject(
          new NewPasswordRequiredError(userAttributes, requiredAttributes)
        );
      },

      // TODO: MFA ?

      onFailure(err) {
        reject(dispatchError(err));
      },
    });
  });

  return waitForPromise(promise);
}
