import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import RouterService from '@ember/routing/router-service';
import Service, { inject as service } from '@ember/service';
import { getOwnConfig, isTesting, macroCondition } from '@embroider/macros';
import { tracked } from '@glimmer/tracking';
import {
  CognitoAccessToken,
  CognitoIdToken,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  ICognitoStorage,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';
import {
  MfaCodeRequiredError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import { CognitoUserMfa } from 'ember-cognito-identity/utils/cognito-mfa';
import { authenticateUser } from 'ember-cognito-identity/utils/cognito/authenticate-user';
import { globalSignOut } from 'ember-cognito-identity/utils/cognito/global-sign-out';
import { refreshAccessToken } from 'ember-cognito-identity/utils/cognito/refresh-access-token';
import { setNewPassword } from 'ember-cognito-identity/utils/cognito/set-new-password';
import { triggerResetPasswordMail } from 'ember-cognito-identity/utils/cognito/trigger-reset-password-mail';
import { updatePassword } from 'ember-cognito-identity/utils/cognito/update-password';
import { updateResetPassword } from 'ember-cognito-identity/utils/cognito/update-reset-password';
import { updateUserAttributes } from 'ember-cognito-identity/utils/cognito/update-user-attributes';
import { getTokenRefreshWait } from 'ember-cognito-identity/utils/get-token-refresh-wait';
import { getUserAttributes } from 'ember-cognito-identity/utils/get-user-attributes';
import { loadUserDataAndAccessToken } from 'ember-cognito-identity/utils/load-user-data-and-access-token';
import { mockCognitoUser } from 'ember-cognito-identity/utils/mock/cognito-user';
import { mockCognitoUserPool } from 'ember-cognito-identity/utils/mock/cognito-user-pool';
import { restartableTask, timeout } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import type ApplicationInstance from '@ember/application/instance';

export interface CognitoData {
  cognitoUser: CognitoUser;
  userAttributes: UserAttributes;
  cognitoUserSession: CognitoUserSession;
  jwtToken: string;
  getAccessToken: () => CognitoAccessToken;
  getIdToken: () => CognitoIdToken;
  mfa: CognitoUserMfa;
}

export type UserAttributes = { [key: string]: any };

export default class CognitoService extends Service {
  @service router: RouterService;

  // Overwrite for testing
  _cognitoStorage: undefined | ICognitoStorage;

  @tracked cognitoData: null | CognitoData = null;

  // When calling `authenticate()` throws a `MfaCodeRequiredError`, we cache the user here
  // We need it when then calling `mfaCompleteAuthentication()` later, at which point it will be reset
  _tempMfaCognitoUser?: CognitoUser;

  // Can be set in tests to generate assert.step() logs
  _assert?: any;

  get isAuthenticated(): boolean {
    return Boolean(this.cognitoData);
  }

  get config(): {
    userPoolId: string;
    clientId: string;
    endpoint?: string;
    authenticationFlowType?: 'USER_SRP_AUTH' | 'USER_PASSWORD_AUTH';
  } {
    let config = (getOwner(this) as ApplicationInstance).resolveRegistration(
      'config:environment'
    ) as any;
    return config.cognito;
  }

  shouldAutoRefresh = !isTesting();

  _userPool: CognitoUserPool | undefined;
  get userPool(): CognitoUserPool {
    if (this._userPool) {
      return this._userPool;
    }

    if (macroCondition(getOwnConfig<any>().enableMocks)) {
      // eslint-disable-next-line ember/no-side-effects
      this._userPool = mockCognitoUserPool() as unknown as CognitoUserPool;

      return this._userPool;
    }

    assert(
      'A `cognito` configuration object needs to be defined in config/environment.js',
      typeof this.config === 'object'
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

    // eslint-disable-next-line ember/no-side-effects
    this._userPool = new CognitoUserPool(poolData);

    return this._userPool;
  }

  // This should be called in application route, before everything else
  async restoreAndLoad(): Promise<CognitoData> {
    if (this.cognitoData) {
      return this.cognitoData;
    }

    this.cognitoData = await loadUserDataAndAccessToken(this.userPool);

    if (this.shouldAutoRefresh) {
      taskFor(this._debouncedRefreshAccessToken).perform();
    }

    return this.cognitoData;
  }

  async refreshAccessToken(): Promise<void> {
    assert(
      'cognitoData is not setup, user is probably not logged in',
      !!this.cognitoData
    );

    let { cognitoUser, cognitoUserSession } = this.cognitoData!;

    await refreshAccessToken(cognitoUserSession, cognitoUser);
    this.cognitoData = await loadUserDataAndAccessToken(this.userPool);
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

  logout(): void {
    if (this.cognitoData) {
      this.cognitoData.cognitoUser.signOut();
      this.cognitoData = null;

      taskFor(this._debouncedRefreshAccessToken).cancelAll();
    }
  }

  // Only call this if you are in an inconsistent state
  logoutForce(): void {
    this.userPool.getCurrentUser()?.signOut();
    this.cognitoData = null;

    taskFor(this._debouncedRefreshAccessToken).cancelAll();
  }

  invalidateAccessTokens(): Promise<void> {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `invalidateAccessTokens()`',
      !!this.cognitoData
    );

    let { cognitoUser } = this.cognitoData!;

    return globalSignOut(cognitoUser);
  }

  triggerResetPasswordMail({ username }: { username: string }): Promise<void> {
    let cognitoUser = this._createCognitoUser({ username });

    return triggerResetPasswordMail(cognitoUser);
  }

  async mfaCompleteAuthentication(code: string): Promise<void> {
    assert(
      'mfaCompleteAuthentication: You may only call this method after calling `authenticate()` before, leading to a `MfaCodeRequiredError` error.',
      !!this._tempMfaCognitoUser
    );

    let cognitoMfa = new CognitoUserMfa(this._tempMfaCognitoUser!);

    await cognitoMfa.completeAuthentication(code);
    this._tempMfaCognitoUser = undefined;

    await this.restoreAndLoad();
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
  }): Promise<void> {
    let cognitoUser = this._createCognitoUser({ username });

    return updateResetPassword(cognitoUser, { code, newPassword });
  }

  /*
    Might reject with:
    * InvalidPasswordError (e.g. password too short)
   */
  async setNewPassword(
    {
      username,
      password,
      newPassword,
    }: { username: string; password: string; newPassword: string },
    newAttributes = {}
  ): Promise<void> {
    let cognitoUser = this._createCognitoUser({ username });

    try {
      await this._authenticate({ username, password, cognitoUser });
    } catch (error) {
      // This _should_ error, otherwise the user does not need to set a new password
      if (!(error instanceof NewPasswordRequiredError)) {
        throw error;
      }

      await setNewPassword(cognitoUser, { newPassword }, newAttributes);
      return;
    }

    assert(
      'You seem to have called `setNewPassword` without it being required.',
      false
    );
  }

  updatePassword({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `updatePassword()`',
      !!this.cognitoData
    );

    let { cognitoUser } = this.cognitoData!;

    return updatePassword(cognitoUser, { oldPassword, newPassword });
  }

  async updateAttributes(attributes: {
    [index: string]: string;
  }): Promise<{ [index: string]: string }> {
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

    await updateUserAttributes(cognitoUser, attributeList);
    let userAttributes = await getUserAttributes(cognitoUser);

    this.cognitoData!.userAttributes = userAttributes;

    return userAttributes;
  }

  authenticateUser(
    cognitoUser: CognitoUser,
    { username, password }: { username: string; password: string }
  ): Promise<CognitoUser> {
    return authenticateUser(cognitoUser, { username, password });
  }

  @restartableTask
  *_debouncedRefreshAccessToken(): any {
    assert(
      'cognitoData is not set, make sure to be authenticated before calling `_debouncedRefreshAccessToken.perform()`',
      !!this.cognitoData
    );

    let autoRefreshWait = getTokenRefreshWait(
      this.cognitoData.cognitoUserSession
    );

    yield timeout(autoRefreshWait);

    try {
      yield this.refreshAccessToken();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      // We want to continue and try again
    }

    taskFor(this._debouncedRefreshAccessToken).perform();
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

    try {
      return await this.authenticateUser(actualCognitoUser, {
        username,
        password,
      });
    } catch (error) {
      if (error instanceof MfaCodeRequiredError) {
        this._tempMfaCognitoUser = error.cognitoUser;
      }

      throw error;
    }
  }

  _createCognitoUser({ username }: { username: string }): CognitoUser {
    let { userPool, _cognitoStorage: storage } = this;

    let userData = {
      Username: username,
      Pool: userPool,
      Storage: storage,
    };

    if (macroCondition(getOwnConfig<any>().enableMocks)) {
      return mockCognitoUser({
        username,
        userPool,
        assert: this._assert,
      }) as unknown as CognitoUser;
    }

    let cognitoUser = new CognitoUser(userData);
    let { config } = this;
    if (config.authenticationFlowType) {
      cognitoUser.setAuthenticationFlowType(config.authenticationFlowType);
    }

    return cognitoUser;
  }
}
