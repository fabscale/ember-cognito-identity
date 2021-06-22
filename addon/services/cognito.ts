import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import RouterService from '@ember/routing/router-service';
import Service, { inject as service } from '@ember/service';
import { waitForPromise } from '@ember/test-waiters';
import { tracked } from '@glimmer/tracking';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  ICognitoStorage,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';
import {
  AmazonCognitoIdentityJsError,
  CognitoNotAuthenticatedError,
  dispatchError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import { getUserAttributes } from 'ember-cognito-identity/utils/user-data';
import { restartableTask, timeout } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { Promise as RSVPPromise } from 'rsvp';

interface CognitoData {
  cognitoUser: CognitoUser;
  userAttributes: UserAttributes;
  cognitoUserSession: CognitoUserSession;
  jwtToken: string;
}

export type UserAttributes = { [key: string]: any };

export default class CognitoService extends Service {
  @service router: RouterService;

  // Overwrite for testing
  _cognitoStorage: undefined | ICognitoStorage;

  @tracked cognitoData: null | CognitoData = null;

  get isAuthenticated() {
    return Boolean(this.cognitoData);
  }

  get config() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.cognito;
  }

  get isTesting() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment === 'test';
  }

  get shouldAutoRefresh() {
    return !this.isTesting;
  }

  autoRefreshInterval = 1000 * 60 * 45; // Tokens expire after 1h, so we refresh them every 45 minutes, to have a bit of leeway

  _userPool: CognitoUserPool | undefined;
  get userPool(): CognitoUserPool {
    if (this._userPool) {
      return this._userPool;
    }

    assert(
      'A `cognito` configuration object needs to be defined in config/environment.js',
      this.config
    );
    let { userPoolId, clientId, endpoint } = this.config;

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
      Storage: this._cognitoStorage,
      endpoint,
    };

    this._userPool = new CognitoUserPool(poolData);
    return this._userPool;
  }

  // This should be called in application route, before everything else
  restoreAndLoad(): Promise<any> {
    if (this.cognitoData) {
      return RSVPPromise.resolve(this.cognitoData);
    }

    return this._loadUserDataAndAccessToken();
  }

  async refreshAccessToken(): Promise<any> {
    assert(
      'cognitoData is not setup, user is probably not logged in',
      !!this.cognitoData
    );

    // Note: @types/amazon-cognito-auth-js is incorrectly missing this
    // @ts-ignore next-line
    let { refreshToken } = this.cognitoData.cognitoUserSession;

    if (!refreshToken || !refreshToken.getToken()) {
      throw new Error('Cannot retrieve a refresh token');
    }

    let promise = new RSVPPromise((resolve, reject) => {
      this.cognitoData!.cognitoUser.refreshSession(refreshToken, (error) => {
        if (error) {
          return reject(dispatchError(error));
        }

        this._loadUserDataAndAccessToken().then(resolve, reject);
      });
    });

    waitForPromise(promise);
    return promise;
  }

  async _loadUserDataAndAccessToken(): Promise<CognitoData | null> {
    let { userPool } = this;

    let cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      throw new CognitoNotAuthenticatedError();
    }

    return this._loadCognitoUserSession(cognitoUser);
  }

  async _loadCognitoUserSession(
    cognitoUser: CognitoUser
  ): Promise<CognitoData> {
    let cognitoUserSession: CognitoUserSession;

    let userAttributes;
    try {
      cognitoUserSession = await this._getSession(cognitoUser);
      userAttributes = await getUserAttributes(cognitoUser);
    } catch (error) {
      cognitoUser.signOut();
      throw error;
    }

    let jwtToken = cognitoUserSession.getAccessToken().getJwtToken();

    let cognitoData: CognitoData = {
      cognitoUser,
      userAttributes,
      cognitoUserSession,
      jwtToken,
    };

    this.cognitoData = cognitoData;

    if (this.shouldAutoRefresh) {
      taskFor(this._debouncedRefreshAccessToken).perform();
    }

    return cognitoData;
  }

  _getSession(cognitoUser: CognitoUser): Promise<CognitoUserSession> {
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

    waitForPromise(promise);
    return promise;
  }

  async authenticate({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<CognitoData> {
    assert('cognitoData is already setup', !this.cognitoData);

    await this._authenticate({ username, password });
    await this.restoreAndLoad();

    return this.cognitoData!;
  }

  async _authenticate({
    username,
    password,
    cognitoUser,
  }: {
    username: string;
    password: string;
    cognitoUser?: CognitoUser;
  }): Promise<CognitoUser> {
    assert('cognitoData is already setup', !this.cognitoData);

    let actualCognitoUser =
      typeof cognitoUser === 'undefined'
        ? this._createCognitoUser({ username })
        : cognitoUser;

    return this._authenticateAndLoadData({
      username,
      password,
      cognitoUser: actualCognitoUser,
    });
  }

  /*
    Might reject with:
    * InvalidAuthorizationError (username/password wrong)
    * NewPasswordRequiredError (new user)
    * PasswordResetRequiredError (password reset required by admin)

    Resolves with an object with cognitoUser & accessToken
   */
  _authenticateAndLoadData({
    username,
    password,
    cognitoUser,
  }: {
    username: string;
    password: string;
    cognitoUser: CognitoUser;
  }): Promise<CognitoUser> {
    let authenticationData = {
      Username: username,
      Password: password,
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);

    let promise: Promise<CognitoUser> = new RSVPPromise((resolve, reject) => {
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
        },
      });
    });

    waitForPromise(promise);
    return promise;
  }

  logout(): void {
    if (this.cognitoData) {
      this.cognitoData.cognitoUser.signOut();
      this.cognitoData = null;

      taskFor(this._debouncedRefreshAccessToken).cancelAll();
    }
  }

  invalidateAccessTokens(): Promise<any> {
    let promise = new RSVPPromise((resolve, reject) => {
      if (!this.cognitoData) {
        return reject();
      }

      this.cognitoData.cognitoUser.globalSignOut({
        onSuccess: () => {
          resolve();
        },

        onFailure(err) {
          reject(dispatchError(err));
        },
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
        },
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
    newPassword,
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
        },
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
      newPassword,
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
            },
          });
        }
      );
    });

    waitForPromise(promise);
    return promise;
  }

  updatePassword({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string;
    newPassword: string;
  }): Promise<any> {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `updatePassword()`',
      !!this.cognitoData
    );

    let { cognitoUser } = this.cognitoData!;

    let promise = new RSVPPromise((resolve, reject) => {
      cognitoUser.changePassword(oldPassword, newPassword, function (error) {
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

    let { cognitoUser } = this.cognitoData!;

    let attributeList: ICognitoUserAttributeData[] = Object.keys(
      attributes
    ).map((attributeName) => {
      return {
        Name: attributeName,
        Value: attributes[attributeName],
      };
    });

    let promise = new RSVPPromise((resolve, reject) => {
      cognitoUser.updateAttributes(
        attributeList,
        (error: AmazonCognitoIdentityJsError) => {
          if (error) {
            return reject(dispatchError(error));
          }

          getUserAttributes(cognitoUser)
            .then((userAttributes) => {
              this.cognitoData!.userAttributes = userAttributes;
              resolve(userAttributes);
            })
            .catch(reject);
        }
      );
    });

    waitForPromise(promise);
    return promise;
  }

  @restartableTask
  *_debouncedRefreshAccessToken() {
    yield timeout(this.autoRefreshInterval);

    yield this.refreshAccessToken();
  }

  _createCognitoUser({ username }: { username: string }): CognitoUser {
    let { userPool, _cognitoStorage: storage } = this;

    let userData = {
      Username: username,
      Pool: userPool,
      Storage: storage,
    };

    return new CognitoUser(userData);
  }
}
