import Service, { inject as service } from '@ember/service';
import { bool } from '@ember/object/computed';
import { Promise as RSVPPromise } from 'rsvp';
import {
  AmazonCognitoIdentityJsError,
  dispatchError,
  NewPasswordRequiredError
} from '@fabscale/ember-cognito-identity/errors/cognito';
import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { waitForPromise } from 'ember-test-waiters';
import { tracked } from '@glimmer/tracking';
import {
  ICognitoStorage,
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
  ICognitoUserAttributeData,
  CognitoUserSession
} from 'amazon-cognito-identity-js';
import RouterService from '@ember/routing/router-service';

interface CognitoData {
  cognitoUser: CognitoUser;
  userAttributes: Object;
  cognitoUserSession: CognitoUserSession;
  jwtToken: string;
}

export default class CognitoService extends Service {
  @service router: RouterService;

  // Overwrite if necessary
  loginRoute: string = 'login';
  resetPasswordRoute: string = 'reset-password';
  afterLoginRoute: string = 'index';

  // Overwrite for testing
  _cognitoStorage: undefined | ICognitoStorage;

  @tracked cognitoData: null | CognitoData = null;
  @bool('cognitoData') isAuthenticated: boolean;

  get config() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.cognito;
  }

  _userPool: CognitoUserPool | undefined;
  get userPool(): CognitoUserPool {
    if (this._userPool) {
      return this._userPool;
    }

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

    this._userPool = new CognitoUserPool(poolData);
    return this._userPool;
  }

  // Hooks begin

  // eslint-disable-next-line no-unused-vars
  onAuthenticated() {
    this.router.transitionTo(this.afterLoginRoute);
  }

  onUnauthenticated() {
    this.router.transitionTo(this.loginRoute);
  }
  // Hooks end

  // This should be called in application route, before everything else
  restoreAndLoad(): Promise<any> {
    if (this.cognitoData) {
      return RSVPPromise.resolve(this.cognitoData);
    }

    let { userPool } = this;

    let promise = new RSVPPromise((resolve, reject) => {
      let cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        return reject(null);
      }

      cognitoUser.getSession(
        (
          error: AmazonCognitoIdentityJsError | null,
          cognitoUserSession: CognitoUserSession
        ) => {
          if (error) {
            cognitoUser.signOut();
            return reject(dispatchError(error));
          }

          this._getUserAttributes(cognitoUser).then(
            (userAttributes) => {
              let jwtToken = cognitoUserSession.getAccessToken().getJwtToken();

              let cognitoData: CognitoData = {
                cognitoUser,
                userAttributes,
                cognitoUserSession,
                jwtToken
              };

              this.cognitoData = cognitoData;

              resolve(cognitoData);
            },
            (error) => {
              cognitoUser.signOut();
              reject(error);
            }
          );
        }
      );
    });

    waitForPromise(promise);
    return promise;
  }

  async authenticate({
    username,
    password
  }: {
    username: string;
    password: string;
  }): Promise<CognitoData> {
    assert('cognitoData is already setup', !this.cognitoData);

    await this._authenticate({ username, password });
    await this.restoreAndLoad();
    await this.onAuthenticated();

    return this.cognitoData;
  }

  /*
    Might reject with:
    * InvalidAuthorizationError (username/password wrong)
    * NewPasswordRequiredError (new user)
    * PasswordResetRequiredError (password reset required by admin)

    Resolves with an object with cognitoUser & accessToken
   */
  _authenticate({
    username,
    password,
    cognitoUser
  }: {
    username: string;
    password: string;
    cognitoUser?: CognitoUser;
  }): Promise<any> {
    assert('cognitoData is already setup', !this.cognitoData);

    cognitoUser = cognitoUser || this._createCognitoUser({ username });

    let authenticationData = {
      Username: username,
      Password: password
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);

    let promise = new RSVPPromise((resolve, reject) => {
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
  }

  logout(): void {
    if (this.cognitoData) {
      this.cognitoData.cognitoUser.signOut();
      this.cognitoData = null;
    }

    this.onUnauthenticated();
  }

  invalidateAccessTokens(): Promise<any> {
    let promise = new RSVPPromise((resolve, reject) => {
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
  }

  triggerResetPasswordMail({ username }: { username: string }): Promise<any> {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new RSVPPromise((resolve, reject) => {
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
  }

  /*
    Might reject with:
    * InvalidPasswordError (e.g. password too short)
    * VerificationCodeMismatchError (wrong code)
   */
  updateResetPassword({
    username,
    code,
    newPassword
  }: {
    username: string;
    code: string;
    newPassword: string;
  }): Promise<any> {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new RSVPPromise((resolve, reject) => {
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
        }
      });
    });

    waitForPromise(promise);
    return promise;
  }

  /*
    Might reject with:
    * InvalidPasswordError (e.g. password too short)
   */
  setNewPassword(
    {
      username,
      password,
      newPassword
    }: { username: string; password: string; newPassword: string },
    newAttributes = {}
  ): Promise<any> {
    let cognitoUser = this._createCognitoUser({ username });

    let promise = new RSVPPromise((resolve, reject) => {
      this._authenticate({ username, password, cognitoUser }).then(
        () => {
          assert(
            'You seem to have called `setNewPassword` without it being required.',
            false
          );
          resolve();
        },
        () => {
          cognitoUser.completeNewPasswordChallenge(newPassword, newAttributes, {
            onSuccess() {
              resolve();
            },

            onFailure(err) {
              reject(dispatchError(err));
            }
          });
        }
      );
    });

    waitForPromise(promise);
    return promise;
  }

  updatePassword({
    oldPassword,
    newPassword
  }: {
    oldPassword: string;
    newPassword: string;
  }): Promise<any> {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `updatePassword()`',
      !!this.cognitoData
    );

    let { cognitoUser } = this.cognitoData;

    let promise = new RSVPPromise((resolve, reject) => {
      cognitoUser.changePassword(oldPassword, newPassword, function(error) {
        if (error) {
          return reject(dispatchError(error));
        }

        resolve();
      });
    });

    waitForPromise(promise);
    return promise;
  }

  updateAttributes(attributes: { [index: string]: string }): Promise<any> {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `updateAttributes()`',
      !!this.cognitoData
    );

    let { cognitoUser } = this.cognitoData;

    let attributeList: ICognitoUserAttributeData[] = Object.keys(
      attributes
    ).map((attributeName) => {
      return {
        Name: attributeName,
        Value: attributes[attributeName]
      };
    });

    let promise = new RSVPPromise((resolve, reject) => {
      cognitoUser.updateAttributes(
        attributeList,
        (error: AmazonCognitoIdentityJsError) => {
          if (error) {
            return reject(dispatchError(error));
          }

          this._getUserAttributes(cognitoUser)
            .then((userAttributes) => {
              this.cognitoData.userAttributes = userAttributes;
              resolve(userAttributes);
            })
            .catch(reject);
        }
      );
    });

    waitForPromise(promise);
    return promise;
  }

  _createCognitoUser({ username }: { username: string }): CognitoUser {
    let { userPool, _cognitoStorage: storage } = this;

    let userData = {
      Username: username,
      Pool: userPool,
      Storage: storage
    };

    return new CognitoUser(userData);
  }

  _getUserAttributes(cognitoUser: CognitoUser): Promise<any> {
    let promise = new RSVPPromise((resolve, reject) => {
      cognitoUser.getUserAttributes((error, cognitoUserAttributes) => {
        if (error) {
          return reject(dispatchError(error));
        }

        let userAttributes: { [index: string]: string } = {};
        cognitoUserAttributes.forEach((cognitoUserAttribute) => {
          let name = cognitoUserAttribute.getName();
          let value = cognitoUserAttribute.getValue();

          userAttributes[name] = value;
        });

        resolve(userAttributes);
      });
    });

    waitForPromise(promise);
    return promise;
  }
}