import { assert } from '@ember/debug';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { associateSoftwareToken } from './cognito/associate-software-token';
import { getUserData } from './cognito/get-user-data';
import { sendMfaCode } from './cognito/send-mfa-code';
import { setUserMfaPreference } from './cognito/set-user-mfa-preference';
import { verifySoftwareToken } from './cognito/verify-software-token';

export type CognitoMfaSetting = 'OFF' | 'TOTP';

export class CognitoUserMfa {
  cognitoUser: CognitoUser;

  constructor(cognitoUser: CognitoUser) {
    this.cognitoUser = cognitoUser;
  }

  enable(): Promise<CognitoMfaSetting> {
    return this._toggleMfaEnabled(true);
  }

  disable(): Promise<CognitoMfaSetting> {
    return this._toggleMfaEnabled(false);
  }

  async getMfaSetting({
    forceReload = false,
  } = {}): Promise<CognitoMfaSetting> {
    let userData = await getUserData(this.cognitoUser, { forceReload });

    return userData.PreferredMfaSetting === 'SOFTWARE_TOKEN_MFA'
      ? 'TOTP'
      : 'OFF';
  }

  async isEnabled(): Promise<boolean> {
    let mfaSetting = await this.getMfaSetting();
    return mfaSetting !== 'OFF';
  }

  completeAuthentication(code: string): Promise<void> {
    assert(
      'cognitoUser is not set, make sure to be authenticated before calling `completeAuthentication()`',
      !!this.cognitoUser
    );

    return sendMfaCode(this.cognitoUser, code);
  }

  setupDevice(): Promise<string> {
    assert(
      'cognitoUser is not set, make sure to be authenticated before calling `setupDevice()`',
      !!this.cognitoUser
    );

    return associateSoftwareToken(this.cognitoUser);
  }

  verifyDevice(
    challengeAnswer: string,
    deviceName = 'MFA Device'
  ): Promise<void> {
    assert(
      'cognitoUser is not set, make sure to be authenticated before calling `verifyDevice()`',
      !!this.cognitoUser
    );

    return verifySoftwareToken(this.cognitoUser, challengeAnswer, deviceName);
  }

  async _toggleMfaEnabled(enable = true): Promise<CognitoMfaSetting> {
    assert(
      'cognitoUser is not set, make sure to be authenticated before calling `_toggleMfaEnabled()`',
      !!this.cognitoUser
    );

    let { cognitoUser } = this;

    await setUserMfaPreference(cognitoUser, enable);

    return this.getMfaSetting({ forceReload: true });
  }
}
