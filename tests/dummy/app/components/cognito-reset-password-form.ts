import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { dropTask } from 'ember-concurrency-decorators';
import { or } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';
import CognitoService from 'ember-cognito-identity/services/cognito';
import RouterService from '@ember/routing/router-service';
import { CognitoError } from 'ember-cognito-identity/errors/cognito';

interface Args {
  username?: 'string';
  verificationCode?: 'string';
}

export default class CognitoResetPasswordForm extends Component<Args> {
  @service cognito: CognitoService;
  @service router: RouterService;

  // Properties
  @tracked password?: string;
  @tracked selectedUsername?: string;
  @tracked selectedVerificationCode?: string;
  @tracked error: CognitoError | null;
  @tracked showPasswordForm: boolean = false;

  @or('triggerResetPasswordEmailTask.isRunning', 'resetPasswordTask.isRunning')
  isPending: boolean;

  constructor(owner: any, args: Args) {
    super(owner, args);

    this.selectedUsername = this.args.username;
    this.selectedVerificationCode = this.args.verificationCode;

    if (this.selectedUsername) {
      this.showPasswordForm = true;
    }
  }

  @dropTask
  *triggerResetPasswordEmailTask(username: string) {
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
  }

  @dropTask
  *resetPasswordTask({
    username,
    password,
    verificationCode,
  }: {
    username: string;
    password: string;
    verificationCode: string;
  }) {
    let { cognito } = this;

    this.error = null;

    if (!verificationCode || !password || !username) {
      return;
    }

    try {
      yield cognito.updateResetPassword({
        username,
        code: verificationCode,
        newPassword: password,
      });
      yield cognito.authenticate({ username, password });
    } catch (error) {
      this.error = error;
      return;
    }

    this.router.transitionTo(this.cognito.afterLoginRoute);
  }

  @action
  updateUsername(username: string) {
    this.selectedUsername = username;
  }

  @action
  updateVerificationCode(verificationCode: string) {
    this.selectedVerificationCode = verificationCode;
  }

  @action
  updatePassword(password: string) {
    this.password = password;
  }

  @action
  skipTriggerResetPasswordEmail(username: string) {
    this.selectedUsername = username;
    this.error = null;
    this.showPasswordForm = true;
  }

  @action
  resendVerificationCode() {
    this.showPasswordForm = false;
  }
}
