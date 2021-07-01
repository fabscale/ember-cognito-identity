import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Args {
  username?: string;
  verificationCode?: string;
  resetPassword: ({
    username,
    password,
    verificationCode,
  }: {
    username: string;
    password: string;
    verificationCode: string;
  }) => void;
}

export default class CognitoResetPasswordFormUpdatePassword extends Component<Args> {
  // Properties
  @tracked currentVerificationCode?: string;
  @tracked password?: string;

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this.currentVerificationCode = this.args.verificationCode;
  }

  @action
  updateVerificationCode(verificationCode: string): void {
    this.currentVerificationCode = verificationCode;
  }

  @action
  updatePassword(password: string): void {
    this.password = password;
  }

  @action
  onSubmit(event: Event): void {
    event.preventDefault();

    let { password, currentVerificationCode: verificationCode } = this;
    let { username } = this.args;

    if (!username || !password || !verificationCode) {
      return;
    }

    this.args.resetPassword({ username, password, verificationCode });
  }
}
