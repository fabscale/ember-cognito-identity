import Component from '@ember/component';
import layout from './template';
import { set, action } from '@ember/object';
import { inject as service } from '@ember/service';
import { NewPasswordRequiredError } from '@fabscale/ember-cognito-identity/errors/cognito';
import { dropTask } from 'ember-concurrency-decorators';

export default class CognitoLoginForm extends Component {
  layout = layout;
  @service cognito;
  @service router;

  // Properties
  username = null;
  password = null;
  newPassword = null;

  mustEnterNewPassword = false;
  error = null;

  @dropTask()
  submitFormTask = function*() {
    let {
      cognito,
      username,
      password,
      newPassword,
      mustEnterNewPassword
    } = this;

    set(this, 'error', null);

    if (mustEnterNewPassword) {
      try {
        let newAttributes = this._getNewPasswordAttributes({ username });
        yield cognito.setNewPassword(
          { username, password, newPassword },
          newAttributes
        );
      } catch (error) {
        set(this, 'error', error);
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
        set(this, 'mustEnterNewPassword', true);
        return;
      }

      set(this, 'error', error);
    }
  };

  // This can be overwritten
  _getNewPasswordAttributes() {
    return undefined;
  }

  @action
  updateUsername(username) {
    set(this, 'username', username);
  }

  @action
  updatePassword(password) {
    set(this, 'password', password);
  }

  @action
  updateNewPassword(newPassword) {
    set(this, 'newPassword', newPassword);
  }
}
