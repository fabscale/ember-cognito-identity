import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import {
  CognitoError,
  NewPasswordRequiredError,
} from 'ember-cognito-identity/errors/cognito';
import { dropTask } from 'ember-concurrency-decorators';
import { tracked } from '@glimmer/tracking';
import CognitoService, {
  UserAttributes,
} from 'ember-cognito-identity/services/cognito';
import RouterService from '@ember/routing/router-service';

export default class CognitoLoginForm extends Component {
  @service cognito: CognitoService;
  @service router: RouterService;

  // Properties
  @tracked username: string;
  @tracked password: string;
  @tracked newPassword: string;
  @tracked mustEnterNewPassword: boolean = false;
  @tracked error: CognitoError | null;

  @dropTask
  *submitFormTask() {
    let {
      cognito,
      username,
      password,
      newPassword,
      mustEnterNewPassword,
    } = this;

    this.error = null;

    if (mustEnterNewPassword) {
      try {
        let newAttributes = this._getNewPasswordAttributes({ username });
        yield cognito.setNewPassword(
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

      this.error = error;
    }
  }

  // This can be overwritten
  // eslint-disable-next-line no-unused-vars
  _getNewPasswordAttributes(
    _options: UserAttributes
  ): undefined | UserAttributes {
    return undefined;
  }

  @action
  updateUsername(username: string) {
    this.username = username;
  }

  @action
  updatePassword(password: string) {
    this.password = password;
  }

  @action
  updateNewPassword(newPassword: string) {
    this.newPassword = newPassword;
  }
}
