import { getOwnConfig, macroCondition } from '@embroider/macros';
import { CognitoUserSession, UserData } from 'amazon-cognito-identity-js';
import { AmazonCognitoIdentityJsError } from 'ember-cognito-identity/errors/cognito';
import { UserAttributes } from 'ember-cognito-identity/services/cognito';
import { mockCognitoUserPool } from './cognito-user-pool';
import { mockCognitoUserSession } from './cognito-user-session';

interface Args {
  username: string;
  cognitoUserSession?: any;
  mfaEnabled?: boolean;
  userPool?: any;
  assert?: any;
}

export const MOCK_COGNITO_CONFIG = {
  mustEnterNewPassword: false,
  mustEnterMfaCode: false,
};

export function mockCognitoUser(args: Args): MockCognitoUser | undefined {
  if (macroCondition(getOwnConfig<any>().enableMocks)) {
    return new MockCognitoUser(args);
  }

  return undefined;
}

class MockCognitoUser {
  #username: string;
  #mfaEnabled = false;
  #cognitoUserSession: any;
  #userPool: any;
  #assert?: any;

  constructor({
    username,
    cognitoUserSession,
    mfaEnabled,
    userPool,
    assert,
  }: Args) {
    this.#username = username;
    this.#mfaEnabled = mfaEnabled || false;
    this.#cognitoUserSession = cognitoUserSession || mockCognitoUserSession();
    this.#userPool = userPool || mockCognitoUserPool();
    this.#assert = assert;
  }

  signOut() {
    this.#assert?.step('cognitoUser.signOut()');
    this.#userPool.setCurrentUser(undefined);
  }

  globalSignOut(callback: { onSuccess: () => void; onFailure: () => void }) {
    this.#assert?.step('cognitoUser.globalSignOut()');
    this.#userPool.setCurrentUser(undefined);
    callback.onSuccess();
  }

  getUsername() {
    return this.#username;
  }

  authenticateUser(
    authenticationDetails: { username: string; password: string },
    callback: {
      onSuccess: () => void;
      onFailure: (error: Error) => void;
      newPasswordRequired: (
        userAttributes: UserAttributes,
        requiredAttributes: UserAttributes
      ) => void;
      totpRequired: () => void;
    }
  ) {
    this.#assert?.step(
      `cognitoUser.authenticateUser(${authenticationDetails.username}, ${authenticationDetails.password})`
    );

    if (authenticationDetails.username !== getOwnConfig<any>().mockUsername) {
      callback.onFailure(
        generateCognitoError({
          type: 'UserNotFoundException',
          message: 'User does not exist.',
        })
      );
      return;
    }

    if (authenticationDetails.password !== getOwnConfig<any>().mockPassword) {
      callback.onFailure(
        generateCognitoError({
          type: 'NotAuthorizedException',
          message: 'Incorrect username or password.',
        })
      );
      return;
    }

    if (MOCK_COGNITO_CONFIG.mustEnterNewPassword) {
      callback.newPasswordRequired({}, {});
      return;
    }

    if (MOCK_COGNITO_CONFIG.mustEnterMfaCode) {
      callback.totpRequired();
      return;
    }

    this.#userPool.setCurrentUser(this);
    callback.onSuccess();
  }

  associateSoftwareToken(callback: {
    associateSecretCode: (secret: string) => string;
    onFailure: (error: Error) => void;
  }) {
    this.#assert?.step(`cognitoUser.associateSoftwareToken()`);
    callback.associateSecretCode('TEST-SECRET');
  }

  getUserData(
    callback: (error: null | Error, userData: UserData) => void,
    options?: { bypassCache: boolean }
  ) {
    let userData = {
      MFAOptions: [],
      PreferredMfaSetting: this.#mfaEnabled ? 'SOFTWARE_TOKEN_MFA' : undefined,

      UserAttributes: [
        { Name: 'sub', Value: 'aaa-bbb-ccc' },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'email', Value: this.#username },
      ],

      UserMFASettingList: this.#mfaEnabled ? ['SOFTWARE_TOKEN_MFA'] : [],
      Username: 'aaa-bbb-ccc',
    };

    this.#assert?.step(
      `cognitoUser.getUserData(${options ? JSON.stringify(options) : ''})`
    );

    // @ts-ignore
    callback(null, userData);
  }

  getSession(
    callback: (
      error: null | Error,
      cognitoUserSession: CognitoUserSession
    ) => void
  ) {
    this.#assert?.step(`cognitoUser.getSession()`);

    // @ts-ignore
    callback(null, this.#cognitoUserSession);
  }

  refreshSession(_: string, callback: (error: null | Error) => void) {
    this.#assert?.step(`cognitoUser.refreshSession()`);

    let jwtToken = `${this.#cognitoUserSession
      .getAccessToken()
      .getJwtToken()}-REFRESHED`;

    this.#cognitoUserSession = mockCognitoUserSession({ jwtToken });

    callback(null);
  }

  sendMFACode(
    code: string,
    callback: {
      onSuccess: () => void;
      onFailure: (error: AmazonCognitoIdentityJsError) => void;
    }
  ) {
    this.#assert?.step(`cognitoUser.sendMFACode(${code})`);

    if (code !== `${getOwnConfig<any>().mockCode}`) {
      callback.onFailure(
        generateCognitoError({
          type: 'CodeMismatchException',
          message: 'Invalid code received for user',
        })
      );
      return;
    }

    MOCK_COGNITO_CONFIG.mustEnterMfaCode = false;
    this.#userPool.setCurrentUser(this);

    callback.onSuccess();
  }

  completeNewPasswordChallenge(
    newPassword: string,
    newAttributes: any,
    callback: {
      onSuccess: () => void;
      onFailure: (error: AmazonCognitoIdentityJsError) => void;
    }
  ) {
    this.#assert?.step(
      `cognitoUser.completeNewPasswordChallenge(${newPassword}, ${JSON.stringify(
        newAttributes
      )})`
    );

    if (newPassword.length < 8) {
      callback.onFailure(
        generateCognitoError({
          type: 'InvalidPasswordException',
          message:
            'Password does not conform to policy: Password not long enough',
        })
      );
      return;
    }

    MOCK_COGNITO_CONFIG.mustEnterNewPassword = false;

    callback.onSuccess();
  }

  setUserMfaPreference(
    _: any,
    totpSettings: {
      PreferredMfa: boolean;
      Enabled: boolean;
    },
    callback: (error: null | Error) => void
  ) {
    this.#assert?.step(
      `cognitoUser.setUserMfaPreference(${totpSettings.Enabled})`
    );

    this.#mfaEnabled = totpSettings.Enabled;

    callback(null);
  }

  forgotPassword(callback: {
    onSuccess: () => void;
    onFailure: (error: AmazonCognitoIdentityJsError) => void;
  }) {
    this.#assert?.step(`cognitoUser.forgotPassword()`);

    if (this.#username !== getOwnConfig<any>().mockUsername) {
      callback.onFailure(
        generateCognitoError({
          type: 'UserNotFoundException',
          message: 'Username/client id combination not found.',
        })
      );
      return;
    }

    callback.onSuccess();
  }

  changePassword(
    oldPassword: string,
    newPassword: string,
    callback: (error: null | Error) => void
  ) {
    this.#assert?.step(
      `cognitoUser.changePassword(${oldPassword}, ${newPassword})`
    );

    if (oldPassword !== getOwnConfig<any>().mockPassword) {
      callback(
        generateCognitoError({
          type: 'NotAuthorizedException',
          message: 'Incorrect username or password.',
        })
      );
      return;
    }

    if (newPassword.length < 8) {
      callback(
        generateCognitoError({
          type: 'InvalidPasswordException',
          message:
            'Password does not conform to policy: Password not long enough',
        })
      );
      return;
    }

    callback(null);
  }

  confirmPassword(
    code: string,
    newPassword: string,
    callback: {
      onSuccess: () => void;
      onFailure: (error: AmazonCognitoIdentityJsError) => void;
    }
  ) {
    this.#assert?.step(`cognitoUser.confirmPassword(${code}, ${newPassword})`);

    if (code !== `${getOwnConfig<any>().mockCode}`) {
      callback.onFailure(
        generateCognitoError({
          type: 'ExpiredCodeException',
          message: 'Invalid code provided, please request a code again.',
        })
      );
      return;
    }

    if (newPassword.length < 8) {
      callback.onFailure(
        generateCognitoError({
          type: 'InvalidPasswordException',
          message:
            'Password does not conform to policy: Password not long enough',
        })
      );
      return;
    }

    callback.onSuccess();
  }

  updateAttributes(_: any, callback: (error: null | Error) => void) {
    this.#assert?.step(`cognitoUser.updateAttributes()`);

    callback(null);
  }

  verifySoftwareToken(
    token: string,
    deviceName: string,
    callback: {
      onSuccess: () => void;
      onFailure: (error: AmazonCognitoIdentityJsError) => void;
    }
  ) {
    this.#assert?.step(
      `cognitoUser.verifySoftwareToken(${token}, ${deviceName})`
    );

    if (token !== `${getOwnConfig<any>().mockCode}`) {
      callback.onFailure(
        generateCognitoError({
          type: 'EnableSoftwareTokenMFAException',
          message: 'Invalid code received for user',
        })
      );
    }

    callback.onSuccess();
  }
}

function generateCognitoError({
  type,
  message,
}: {
  type: string;
  message: string;
}): AmazonCognitoIdentityJsError {
  return {
    code: type,
    name: type,
    message,
  };
}
