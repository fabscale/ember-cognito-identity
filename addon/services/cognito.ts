import 'ember-cached-decorator-polyfill';
import { getOwner } from '@ember/application';
import type ApplicationInstance from '@ember/application/instance';
import { assert } from '@ember/debug';
import Service from '@ember/service';
import { getOwnConfig, macroCondition } from '@embroider/macros';
import { cached, tracked } from '@glimmer/tracking';
import { CognitoUserPool, ICognitoStorage } from 'amazon-cognito-identity-js';
import 'ember-cached-decorator-polyfill';
import { CognitoAuthenticatedUser } from 'ember-cognito-identity/utils/cognito-authenticated-user';
import { CognitoSession } from 'ember-cognito-identity/utils/cognito-session';
import { CognitoUnauthenticatedUser } from 'ember-cognito-identity/utils/cognito-unauthenticated-user';
import { mockCognitoUserPool } from 'ember-cognito-identity/utils/mock/cognito-user-pool';
// @ts-ignore
import { associateDestroyableChild, destroy } from '@ember/destroyable';

export type UserAttributes = { [key: string]: any };

export default class CognitoService extends Service {
  @tracked session?: CognitoSession;
  @tracked user?: CognitoAuthenticatedUser;

  // Overwrite for testing
  _cognitoStorage: undefined | ICognitoStorage;

  // Can be set in tests to generate assert.step() logs
  _assert?: any;

  get isAuthenticated(): boolean {
    return !!this.session;
  }

  async restoreAndLoad(): Promise<void> {
    if (this.session && this.user) {
      return;
    }

    let data = await this.unauthenticated.restoreAndLoad();

    let user = new CognitoAuthenticatedUser(
      data.cognitoUser,
      data.userAttributes
    );

    let session = new CognitoSession(data.cognitoUser, data.cognitoUserSession);

    this.setupSession({ user, session });
  }

  async authenticate({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<void> {
    await this.unauthenticated.authenticate({ username, password });
    await this.restoreAndLoad();
  }

  async mfaCompleteAuthentication(code: string) {
    await this.unauthenticated.mfaCompleteAuthentication(code);
    await this.restoreAndLoad();
  }

  setupSession(data?: {
    user: CognitoAuthenticatedUser;
    session: CognitoSession;
  }) {
    this.user = data?.user;

    if (this.session) {
      destroy(this.session);
    }

    this.session = data
      ? associateDestroyableChild(this, data.session)
      : undefined;
  }

  logout(): void {
    this.session?.logout();
    this.setupSession(undefined);
  }

  async invalidateAccessTokens(): Promise<void> {
    await this.session?.invalidateAccessTokens();
    this.setupSession(undefined);
  }

  @cached
  get unauthenticated(): CognitoUnauthenticatedUser {
    return new CognitoUnauthenticatedUser(this.userPool, {
      authenticationFlowType: this.config.authenticationFlowType,
      _cognitoStorage: this._cognitoStorage,
      _assert: this._assert,
    });
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

  @cached
  get userPool(): CognitoUserPool {
    if (macroCondition(getOwnConfig<any>().enableMocks)) {
      // eslint-disable-next-line ember/no-side-effects
      return mockCognitoUserPool() as unknown as CognitoUserPool;
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

    return new CognitoUserPool(poolData);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    cognito: CognitoService;
  }
}
