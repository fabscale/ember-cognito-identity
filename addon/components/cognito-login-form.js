import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { NewPasswordRequiredError } from '@fabscale/ember-cognito-identity/errors/cognito';
import { dropTask } from 'ember-concurrency-decorators';
import { tracked } from '@glimmer/tracking';

export default class CognitoLoginForm extends Component {
  @service cognito;
  @service router;

  // Properties
  @tracked username;
  @tracked password;
  @tracked newPassword;
  @tracked mustEnterNewPassword;
  @tracked error;

  @dropTask()
  submitFormTask = function*() {
    let {
      cognito,
      username,
      password,
      newPassword,
      mustEnterNewPassword
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
  };

  // This can be overwritten
  _getNewPasswordAttributes() {
    return undefined;
  }

  @action
  updateUsername(username) {
    this.username = username;
  }

  @action
  updatePassword(password) {
    this.password = password;
  }

  @action
  updateNewPassword(newPassword) {
    this.newPassword = newPassword;
  }
}
