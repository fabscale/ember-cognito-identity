/* global AmazonCognitoIdentity */
import Service, { inject as service } from '@ember/service';
import { computed, set } from '@ember/object';
import { bool } from '@ember/object/computed';
import { Promise } from 'rsvp';
import {
  dispatchError,
  NewPasswordRequiredError
} from 'ember-cognito-identity/errors/cognito';
import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { waitForPromise } from 'ember-test-waiters';

const {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} = AmazonCognitoIdentity;

export default Service.extend({
  router: service(),

  // Overwrite if necessary
  loginRoute: 'login',
  resetPasswordRoute: 'reset-password',
  afterLoginRoute: 'index',

  // Overwrite for testing
  _cognitoStorage: undefined,

  config: computed(function() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.cognito;
  }),

  userPool: computed('config.{userPoolId,clientId}', function() {
    assert(
      'A `cognito` configuration object needs to be defined in config/environment.js',
      this.config
    );
    let { userPoolId, clientId } = this.config;

    assert(
      '`userPoolId` must be specified in the `cognito` configuration in config/environment.js',
      userPoolId
    );
    assert(
      '`clientId` must be specified in the `cognito` configuration in config/environment.js',
      clientId
    );

    let poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId,
      Storage: this._cognitoStorage
    };

    return new CognitoUserPool(poolData);
  }),

  cognitoData: null,

  isAuthenticated: bool('cognitoData'),

  // Hooks begin
  onAuthenticated() {
    this.router.transitionTo(this.afterLoginRoute);
  },

  onUnauthenticated() {
    this.router.transitionTo(this.loginRoute);
  },
  // Hooks end

  // This should be called in application route, before everything else
  restoreAndLoad() {
    let { userPool } = this;

    let cognitoData = {};

    let promise = new Promise((resolve, reject) => {
      let cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        return reject(null);
      }

      cognitoData.cognitoUser = cognitoUser;

      cognitoUser.getSession((error, cognitoUserSession) => {
        if (error) {
          cognitoUser.signOut();
          return reject(dispatchError(error));
        }

        cognitoUser.getUserAttributes((error, cognitoUserAttributes) => {
          if (error) {
            cognitoUser.signOut();
            return reject(dispatchError(error));
          }

          let userAttributes = {};
          cognitoUserAttributes.forEach((cognitoUserAttribute) => {
            userAttributes[cognitoUserAttribute.Name] =
              cognitoUserAttribute.Value;
          });

          cognitoData.userAttributes = userAttributes;
          cognitoData.cognitoUserSession = cognitoUserSession;
          cognitoData.jwtToken = cognitoUserSession
            .getAccessToken()
            .getJwtToken();

          set(this, 'cognitoData', cognitoData);

          resolve(cognitoData);
        });
      });
    });

    waitForPromise(promise);
    return promise;
  },

  async authenticate({ username, password }) {
    assert('cognitoData is already setup', !this.cognitoUserSession);

    await this._authenticate({ username, password });
    await this.restoreAndLoad();
    await this.onAuthenticated(this.cognitoData);

    return this.cognitoData;
  },

  /*
    Might reject with:
    * InvalidAuthorizationError (username/password wrong)
    * NewPasswordRequiredError (new user)
    * PasswordResetRequiredError (password reset required by admin)

    Resolves with an object with cognitoUser & accessToken
   */
  _authenticate({ username, password, cognitoUser }) {
    assert('cognitoData is already setup', !this.cognitoData);

    cognitoUser = cognitoUser || this._createCognitoUser({ username });

    let authenticationData = {
      Username: username,
      Password: password
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);

    let promise = new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: () => {
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
        }
      });
    });

    waitForPromise(promise);
    return promise;
  },

  logout() {
    if (this.cognitoData) {
      this.cognitoData.cognitoUser.signOut();
      set(this, 'cognitoData', null);
    }

    this.onUnauthenticated();
  },

  invalidateAccessTokens() {
    let promise = new Promise((resolve, reject) => {
      this.cognitoData.cognitoUser.globalSignOut({
        onSuccess: () => {
          this.onUnauthenticated();
          resolve();
        },
        onFailure(err) {
          reject(dispatchError(err));
        }
      });
    });

    waitForPromise(promise);
    return promise;
  },

  triggerResetPasswordMail({ username }) {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess() {
          resolve();
        },
        onFailure(err) {
          reject(dispatchError(err));
        }
      });
    });

    waitForPromise(promise);
    return promise;
  },

  /*
    Might reject with:
    * InvalidPasswordError (e.g. password too short)
    * VerificationCodeMismatchError (wrong code)
   */
  updateResetPassword({ username, code, newPassword }) {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess() {
          resolve();
        },
        onFailure(err) {
          // This can also happen, e.g. if the password is shorter than 6 characters
          if (err.code === 'InvalidParameterException') {
            err.code = 'InvalidPasswordException';
            err.name = 'InvalidPasswordException';
          }

          reject(dispatchError(err));
        }
      });
    });

    waitForPromise(promise);
    return promise;
  },

  /*
    Might reject with:
    * InvalidPasswordError (e.g. password too short)
   */
  setNewPassword({ username, password, newPassword }) {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new Promise((resolve, reject) => {
      let data = {
        email: username
      };

      this._authenticate({ username, password, cognitoUser }).then(
        () => {
          assert(
            'You seem to have called `setNewPassword` without it being required.',
            false
          );
          resolve();
        },
        () => {
          cognitoUser.completeNewPasswordChallenge(newPassword, data, {
            onSuccess() {
              resolve();
            },
            onFailure(err) {
              reject(dispatchError(err));
            }
          });
        },
        reject
      );
    });

    waitForPromise(promise);
    return promise;
  },

  updatePassword({ oldPassword, newPassword }) {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `updatePassword()`',
      this.cognitoData
    );

    let { cognitoUser } = this.cognitoData;

    let promise = new Promise((resolve, reject) => {
      cognitoUser.changePassword(oldPassword, newPassword, function(error) {
        if (error) {
          return reject(dispatchError(error));
        }

        resolve();
      });
    });

    waitForPromise(promise);
    return promise;
  },

  _createCognitoUser({ username }) {
    let { userPool, _cognitoStorage: storage } = this;

    let userData = {
      Username: username,
      Pool: userPool,
      Storage: storage
    };

    return new CognitoUser(userData);
  }
});
