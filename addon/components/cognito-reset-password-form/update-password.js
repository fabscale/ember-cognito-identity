import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CognitoResetPasswordFormUpdatePassword extends Component {
  /*
   * Attributes:
   *  - username
   *  - verificationCode
   *  - resetPassword
   */

  // Properties
  @tracked currentVerificationCode;
  @tracked password;

  constructor() {
    super(...arguments);
    this.currentVerificationCode = this.args.verificationCode;
  }

  @action
  updateVerificationCode(verificationCode) {
    this.currentVerificationCode = verificationCode;
  }

  @action
  updatePassword(password) {
    this.password = password;
  }

  @action
  onSubmit() {
    let { password, currentVerificationCode: verificationCode } = this;
    let { username } = this.args;

    this.args.resetPassword({ username, password, verificationCode });
  }
}
