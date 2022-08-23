import { action } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  MfaCodeRequiredError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import CognitoService, {
  UserAttributes,
} from 'ember-cognito-identity/services/cognito';
import { dropTask } from 'ember-concurrency';

export default class CognitoLoginForm extends Component {
  @service declare cognito: CognitoService;
  @service declare router: RouterService;

  // Properties
  @tracked username?: string;
  @tracked password?: string;
  @tracked newPassword?: string;
  @tracked mustEnterNewPassword = false;
  @tracked error: unknown | null;

  @tracked mustEnterMfaCode = false;
  @tracked mfaCode?: string;

  @dropTask
  *submitFormTask(event: Event): any {
    event.preventDefault();

    let {
      cognito,
      username,
      password,
      newPassword,
      mustEnterNewPassword,
      mustEnterMfaCode,
      mfaCode,
    } = this;

    this.error = null;

    if (mustEnterMfaCode) {
      if (!mfaCode) {
        return;
      }

      try {
        yield this.cognito.mfaCompleteAuthentication(mfaCode);
        this.router.transitionTo('index');
        return;
      } catch (error) {
        this.error = error;
        return;
      }
    }

    if (mustEnterNewPassword) {
      if (!username || !password || !newPassword) {
        return;
      }

      try {
        let newAttributes = this._getNewPasswordAttributes({ username });
        yield cognito.unauthenticated.setInitialPassword(
          { username, password, newPassword },
          newAttributes
        );
      } catch (error) {
        this.error = error;
        return;
      }

      password = newPassword;
    }

    if (!username || !password) {
      return;
    }

    try {
      yield cognito.authenticate({ username, password });
    } catch (error) {
      if (error instanceof NewPasswordRequiredError) {
        this.mustEnterNewPassword = true;
        return;
      }

      if (error instanceof MfaCodeRequiredError) {
        this.mustEnterMfaCode = true;
        return;
      }

      this.error = error;
      return;
    }

    this.router.transitionTo('index');
  }

  // This can be overwritten
  // eslint-disable-next-line unused-imports/no-unused-vars
  _getNewPasswordAttributes(_: UserAttributes): undefined | UserAttributes {
    return undefined;
  }

  @action
  updateUsername(username: string): void {
    this.username = username;
  }

  @action
  updatePassword(password: string): void {
    this.password = password;
  }

  @action
  updateNewPassword(newPassword: string): void {
    this.newPassword = newPassword;
  }

  @action
  updateMfaCode(mfaCode: string): void {
    this.mfaCode = mfaCode;
  }
}
