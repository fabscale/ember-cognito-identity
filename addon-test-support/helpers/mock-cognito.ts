import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { MfaCodeMismatchError } from 'ember-cognito-identity/errors/cognito';
import { CognitoData } from 'ember-cognito-identity/services/cognito';
import {
  CognitoMfaSetting,
  CognitoUserMfa,
} from 'ember-cognito-identity/utils/cognito-mfa';

class MockCognitoUserMfa implements CognitoUserMfa {
  cognitoUser: CognitoUser;
  _isEnabled = false;

  async isEnabled() {
    return this._isEnabled;
  }

  async getMfaSetting(): Promise<CognitoMfaSetting> {
    return this._isEnabled ? 'TOTP' : 'OFF';
  }

  async enable(): Promise<CognitoMfaSetting> {
    this._isEnabled = true;
    return 'TOTP';
  }

  async disable(): Promise<CognitoMfaSetting> {
    this._isEnabled = false;
    return 'OFF';
  }

  async setupDevice() {
    return 'TEST-SECRET';
  }

  async verifyDevice(challengeAnswer: string) {
    if (challengeAnswer !== '123456') {
      throw new MfaCodeMismatchError(new Error('Code is invalid'));
    }
  }

  async _toggleMfaEnabled(enabled: boolean): Promise<CognitoMfaSetting> {
    return enabled ? 'TOTP' : 'OFF';
  }

  async completeAuthentication(token: string) {
    if (token !== '123456') {
      throw new MfaCodeMismatchError(new Error('Code is invalid'));
    }
  }
}

export function mockCognito(
  context: any,
  {
    accessToken = 'TEST-ACCESS-TOKEN-AUTO',
    username = 'johnwick@thecontential.assassins',
  } = {}
) {
  let cognito = context.owner.lookup('service:cognito');

  // @ts-ignore
  let cognitoUser: CognitoUser = {
    signOut: () => {
      // noop
    },

    getUsername() {
      return username;
    },
  };

  // @ts-ignore
  let cognitoUserSession: CognitoUserSession = {};

  /* eslint-disable camelcase */
  let userAttributes = {
    email: username,
    email_verified: 'true',
  };
  /* eslint-enable camelcase */

  // @ts-ignore
  let mfa: CognitoUserMfa = new MockCognitoUserMfa();

  let cognitoData: CognitoData = {
    cognitoUser,
    cognitoUserSession,
    userAttributes,
    jwtToken: accessToken,
    mfa,
  };

  cognito.cognitoData = cognitoData;
}

export default mockCognito;
