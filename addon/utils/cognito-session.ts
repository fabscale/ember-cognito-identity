import { tracked } from '@glimmer/tracking';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { globalSignOut } from './cognito/global-sign-out';
import { refreshAccessToken } from './cognito/refresh-access-token';
import {
  getSecondsUntilTokenExpires,
  getTokenRefreshWait,
} from './get-token-refresh-wait';
import { reloadUserSession } from './load-user-data-and-access-token';
// @ts-ignore
import { registerDestructor } from '@ember/destroyable';
import { cancel, later } from '@ember/runloop';

export class CognitoSession {
  cognitoUser: CognitoUser;

  @tracked cognitoUserSession: CognitoUserSession;
  @tracked jwtToken!: string;

  constructor(
    cognitoUser: CognitoUser,
    cognitoUserSession: CognitoUserSession
  ) {
    this.cognitoUser = cognitoUser;
    this.cognitoUserSession = cognitoUserSession;

    this._setJwtToken();

    registerDestructor(this, () => this.disableAutoRefresh());
  }

  logout(): void {
    this.cognitoUser.signOut();
  }

  async invalidateAccessTokens(): Promise<void> {
    await globalSignOut(this.cognitoUser);
  }

  getAccessToken() {
    return this.cognitoUserSession.getAccessToken();
  }

  getIdToken() {
    return this.cognitoUserSession.getIdToken();
  }

  needsRefresh() {
    return !this.cognitoUserSession.isValid();
  }

  // This will return true if the token will expire in the next 15 minutes
  needsRefreshSoon() {
    return this.secondsUntilExpires() <= 15 * 60;
  }

  secondsUntilExpires() {
    return getSecondsUntilTokenExpires(this.cognitoUserSession);
  }

  refresh(): Promise<void> {
    if (this._pendingRefresh) {
      return this._pendingRefresh;
    }

    this._pendingRefresh = this._refresh();
    return this._pendingRefresh;
  }

  _timeout?: any;
  enableAutoRefresh() {
    if (this._timeout) {
      this.disableAutoRefresh();
    }

    let timeout = later(
      this,
      async () => {
        try {
          await this.refreshIfNeeded();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
          // We want to continue and try again
        }

        this.enableAutoRefresh();
      },
      getTokenRefreshWait(this.cognitoUserSession)
    );

    this._timeout = timeout;
  }

  disableAutoRefresh() {
    if (this._timeout) {
      cancel(this._timeout);
      this._timeout = undefined;
    }
  }

  async refreshIfNeeded(): Promise<void> {
    if (this.needsRefreshSoon()) {
      await this.refresh();
    }
  }

  _pendingRefresh?: Promise<void>;
  async _refresh(): Promise<void> {
    await refreshAccessToken(this.cognitoUserSession, this.cognitoUser);
    await this.reloadData();
  }

  async reloadData() {
    this.cognitoUserSession = await reloadUserSession(this.cognitoUser);
    this._setJwtToken();
  }

  _setJwtToken() {
    this.jwtToken = this.getAccessToken().getJwtToken();
  }
}
