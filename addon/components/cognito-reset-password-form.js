import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { dropTask } from 'ember-concurrency-decorators';
import { or } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

export default class CognitoResetPasswordForm extends Component {
  @service cognito;
  @service router;

  /*
   * Attributes:
   *  - username
   *  - verificationCode
   */

  // Properties
  @tracked password;
  @tracked selectedUsername;
  @tracked selectedVerificationCode;
  @tracked error;
  @tracked showPasswordForm = false;

  @or('triggerResetPasswordEmailTask.isRunning', 'resetPasswordTask.isRunning')
  isPending;

  constructor() {
    super(...arguments);

    this.selectedUsername = this.args.username;
    this.selectedVerificationCode = this.args.verificationCode;

    if (this.selectedUsername) {
      this.showPasswordForm = true;
    }
  }

  @dropTask
  triggerResetPasswordEmailTask = function*(username) {
    let { cognito } = this;

    this.error = null;

    try {
      yield cognito.triggerResetPasswordMail({ username });
    } catch (error) {
      this.error = error;
      return;
    }

    this.selectedUsername = username;
    this.showPasswordForm = true;
  };

  @dropTask
  resetPasswordTask = function*({ username, password, verificationCode }) {
    let { cognito } = this;

    this.error = null;

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
      this.error = error;
      return;
    }

    this.router.transitionTo(this.cognito.afterLoginRoute);
  };

  @action
  updateUsername(username) {
    this.selectedUsername = username;
  }

  @action
  updateVerificationCode(verificationCode) {
    this.selectedVerificationCode = verificationCode;
  }

  @action
  updatePassword(password) {
    this.password = password;
  }

  @action
  skipTriggerResetPasswordEmail(username) {
    this.selectedUsername = username;
    this.error = null;
    this.showPasswordForm = true;
  }

  @action
  resendVerificationCode() {
    this.showPasswordForm = false;
  }
}
