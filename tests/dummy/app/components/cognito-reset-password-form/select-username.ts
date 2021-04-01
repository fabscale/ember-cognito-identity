import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Args {
  username?: string;
  triggerResetPasswordEmail: Function;
}

export default class CognitoResetPasswordFormSelectUsername extends Component<Args> {
  // Properties
  @tracked currentUsername?: string;

  constructor(owner: any, args: Args) {
    super(owner, args);

    this.currentUsername = this.args.username;
  }

  @action
  updateUsername(username: string) {
    this.currentUsername = username;
  }

  @action
  onSubmit(event: Event) {
    event.preventDefault();

    this.args.triggerResetPasswordEmail(this.currentUsername);
  }
}
