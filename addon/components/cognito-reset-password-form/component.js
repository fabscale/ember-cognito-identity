import Component from '@ember/component';
import layout from './template';
import { set, action } from '@ember/object';
import { inject as service } from '@ember/service';
import { dropTask } from 'ember-concurrency-decorators';
import { or } from '@ember/object/computed';

export default class CognitoResetPasswordForm extends Component {
  layout = layout;

  @service cognito;
  @service router;

  // Attributes
  username = null;
  verificationCode = null;

  // Properties
  password = null;
  selectedUsername = null;
  selectedVerificationCode = null;
  showPasswordForm = false;

  @or('triggerResetPasswordEmailTask.isRunning', 'resetPasswordTask.isRunning')
  isPending;

  init() {
    super.init(...arguments);

    set(this, 'selectedUsername', this.username);
    set(this, 'selectedVerificationCode', this.verificationCode);

    if (this.selectedUsername) {
      set(this, 'showPasswordForm', true);
    }
  }

  @dropTask
  triggerResetPasswordEmailTask = function*(username) {
    let { cognito } = this;

    set(this, 'error', null);

    try {
      yield cognito.triggerResetPasswordMail({ username });
    } catch (error) {
      set(this, 'error', error);
      return;
    }

    set(this, 'selectedUsername', username);
    set(this, 'showPasswordForm', true);
  };

  @dropTask
  resetPasswordTask = function*({ username, password, verificationCode }) {
    let { cognito } = this;

    set(this, 'error', null);

    if (!verificationCode || !password || !username) {
      return;
    }

    try {
      yield cognito.updateResetPassword({
        username,
        code: verificationCode,
        newPassword: password
      });
      yield cognito.authenticate({ username, password });
    } catch (error) {
      set(this, 'error', error);
      return;
    }

    this.router.transitionTo(this.cognito.afterLoginRoute);
  };

  @action
  updateUsername(username) {
    set(this, 'selectedUsername', username);
  }

  @action
  updateVerificationCode(verificationCode) {
    set(this, 'selectedVerificationCode', verificationCode);
  }

  @action
  updatePassword(password) {
    set(this, 'password', password);
  }

  @action
  skipTriggerResetPasswordEmail(username) {
    set(this, 'selectedUsername', username);
    set(this, 'error', null);

    set(this, 'showPasswordForm', true);
  }

  @action
  resendVerificationCode() {
    set(this, 'showPasswordForm', false);
  }
}
