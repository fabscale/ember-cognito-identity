import Component from '@ember/component';
import layout from './template';
import { set, action } from '@ember/object';

export default class CognitoResetPasswordFormUpdatePassword extends Component {
  layout = layout;

  // Attributes
  username = null;
  verificationCode = null;

  // Properties
  currentVerificationCode = null;
  password = null;

  init() {
    super.init(...arguments);
    set(this, 'currentVerificationCode', this.verificationCode);
  }

  @action
  updateVerificationCode(verificationCode) {
    set(this, 'currentVerificationCode', verificationCode);
  }

  @action
  updatePassword(password) {
    set(this, 'password', password);
  }

  @action
  onSubmit() {
    let {
      username,
      password,
      currentVerificationCode: verificationCode
    } = this;
    this.resetPassword({ username, password, verificationCode });
  }
}
