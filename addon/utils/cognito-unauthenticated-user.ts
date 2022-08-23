import { assert } from '@ember/debug';
import { getOwnConfig, macroCondition } from '@embroider/macros';
import {
  CognitoUser,
  CognitoUserPool,
  ICognitoStorage,
} from 'amazon-cognito-identity-js';
import {
  MfaCodeRequiredError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import { CognitoUserMfa } from './cognito-mfa';
import { authenticateUser } from './cognito/authenticate-user';
import { setNewPassword } from './cognito/set-new-password';
import { triggerResetPasswordMail } from './cognito/trigger-reset-password-mail';
import { updateResetPassword } from './cognito/update-reset-password';
import {
  CognitoData,
  loadUserFromUserPool,
} from './load-user-data-and-access-token';
import { mockCognitoUser } from './mock/cognito-user';

type AuthenticationFlowType = 'USER_SRP_AUTH' | 'USER_PASSWORD_AUTH';

export class CognitoUnauthenticatedUser {
  userPool: CognitoUserPool;
  authenticationFlowType?: AuthenticationFlowType;

  // Overwrite for testing
  _cognitoStorage: undefined | ICognitoStorage;

  // Can be set in tests to generate assert.step() logs
  _assert?: any;

  constructor(
    userPool: CognitoUserPool,
    options?: {
      authenticationFlowType?: AuthenticationFlowType;
      _cognitoStorage?: ICognitoStorage;
      _assert?: any;
    }
  ) {
    this.userPool = userPool;
    this._cognitoStorage = options?._cognitoStorage;
    this._assert = options?._assert;
  }

  // When calling `authenticate()` throws a `MfaCodeRequiredError`, we cache the user here
  // We need it when then calling `mfaCompleteAuthentication()` later, at which point it will be reset
  _tempMfaCognitoUser?: CognitoUser;

  async restoreAndLoad(): Promise<CognitoData> {
    let cognitoData = await loadUserFromUserPool(this.userPool);

    return cognitoData;
  }

  verifyUserAuthentication({
    username,
    password,
    cognitoUser,
  }: {
    username: string;
    password: string;
    cognitoUser?: CognitoUser;
  }): Promise<CognitoUser> {
    let actualCognitoUser =
      typeof cognitoUser === 'undefined'
        ? this._createCognitoUser({ username })
        : cognitoUser;

    return authenticateUser(actualCognitoUser, { username, password });
  }

  async mfaCompleteAuthentication(code: string): Promise<void> {
    assert(
      'mfaCompleteAuthentication: You may only call this method after calling `authenticate()` before, leading to a `MfaCodeRequiredError` error.',
      !!this._tempMfaCognitoUser
    );

    let cognitoMfa = new CognitoUserMfa(this._tempMfaCognitoUser!);

    await cognitoMfa.completeAuthentication(code);
    this._tempMfaCognitoUser = undefined;
  }

  triggerResetPasswordMail({ username }: { username: string }): Promise<void> {
    let cognitoUser = this._createCognitoUser({ username });

    return triggerResetPasswordMail(cognitoUser);
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
  async setInitialPassword(
    {
      username,
      password,
      newPassword,
    }: { username: string; password: string; newPassword: string },
    newAttributes = {}
  ): Promise<void> {
    let cognitoUser = this._createCognitoUser({ username });

    try {
      await this.authenticate({ username, password, cognitoUser });
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

  async authenticate({
    username,
    password,
    cognitoUser,
  }: {
    username: string;
    password: string;
    cognitoUser?: CognitoUser;
  }): Promise<CognitoUser> {
    try {
      return await this.verifyUserAuthentication({
        username,
        password,
        cognitoUser,
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
    let { authenticationFlowType } = this;
    if (authenticationFlowType) {
      cognitoUser.setAuthenticationFlowType(authenticationFlowType);
    }

    return cognitoUser;
  }
}
