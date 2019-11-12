import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Args {
  username?: string;
  triggerResetPasswordEmail: Function;
}

export default class CognitoResetPasswordFormSelectUsername extends Component<
  Args
> {
  // Properties
  @tracked currentUsername: string;

  constructor() {
    // @ts-ignore
    super(...arguments);

    this.currentUsername = this.args.username;
  }

  @action
  updateUsername(username: string) {
    this.currentUsername = username;
  }

  @action
  onSubmit() {
    this.args.triggerResetPasswordEmail(this.currentUsername);
  }
}
