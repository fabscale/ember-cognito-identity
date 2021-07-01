import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Args {
  username?: string;
  triggerResetPasswordEmail: (username: string) => void;
}

export default class CognitoResetPasswordFormSelectUsername extends Component<Args> {
  // Properties
  @tracked currentUsername?: string;

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this.currentUsername = this.args.username;
  }

  @action
  updateUsername(username: string): void {
    this.currentUsername = username;
  }

  @action
  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.currentUsername) {
      return;
    }

    this.args.triggerResetPasswordEmail(this.currentUsername);
  }
}
