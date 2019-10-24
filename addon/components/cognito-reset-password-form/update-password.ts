import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Args {
  username?: string;
  verificationCode?: string;
  resetPassword: Function;
}

export default class CognitoResetPasswordFormUpdatePassword extends Component<
  Args
> {
  // Properties
  @tracked currentVerificationCode: string;
  @tracked password: string;

  constructor() {
    // @ts-ignore
    super(...arguments);
    this.currentVerificationCode = this.args.verificationCode;
  }

  @action
  updateVerificationCode(verificationCode: string) {
    this.currentVerificationCode = verificationCode;
  }

  @action
  updatePassword(password: string) {
    this.password = password;
  }

  @action
  onSubmit() {
    let { password, currentVerificationCode: verificationCode } = this;
    let { username } = this.args;

    this.args.resetPassword({ username, password, verificationCode });
  }
}
