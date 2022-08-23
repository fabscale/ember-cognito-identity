import { action } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { dropTask } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';

interface Args {
  username?: 'string';
  verificationCode?: 'string';
}

export default class CognitoResetPasswordForm extends Component<Args> {
  @service declare cognito: CognitoService;
  @service declare router: RouterService;

  // Properties
  @tracked password?: string;
  @tracked selectedUsername?: string;
  @tracked selectedVerificationCode?: string;
  @tracked error: unknown | null;
  @tracked showPasswordForm = false;

  get isPending(): boolean {
    return (
      taskFor(this.triggerResetPasswordEmailTask).isRunning ||
      taskFor(this.resetPasswordTask).isRunning
    );
  }

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this.selectedUsername = this.args.username;
    this.selectedVerificationCode = this.args.verificationCode;

    if (this.selectedUsername) {
      this.showPasswordForm = true;
    }
  }

  @dropTask
  *triggerResetPasswordEmailTask(username: string): any {
    let { cognito } = this;

    this.error = null;

    try {
      yield cognito.unauthenticated.triggerResetPasswordMail({ username });
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
  }): any {
    let { cognito } = this;

    this.error = null;

    if (!verificationCode || !password || !username) {
      return;
    }

    try {
      yield cognito.unauthenticated.updateResetPassword({
        username,
        code: verificationCode,
        newPassword: password,
      });
      yield cognito.authenticate({ username, password });
    } catch (error) {
      this.error = error;
      return;
    }

    this.router.transitionTo('index');
  }

  @action
  updateUsername(username: string): void {
    this.selectedUsername = username;
  }

  @action
  updateVerificationCode(verificationCode: string): void {
    this.selectedVerificationCode = verificationCode;
  }

  @action
  updatePassword(password: string): void {
    this.password = password;
  }

  @action
  skipTriggerResetPasswordEmail(username: string): void {
    this.selectedUsername = username;
    this.error = null;
    this.showPasswordForm = true;
  }

  @action
  resendVerificationCode(): void {
    this.showPasswordForm = false;
  }
}
