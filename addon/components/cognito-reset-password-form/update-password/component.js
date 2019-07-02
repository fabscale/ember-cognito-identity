import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';

export default Component.extend({
  layout,

  // Attributes
  username: null,
  verificationCode: null,

  // Properties
  currentVerificationCode: null,
  password: null,

  init() {
    this._super(...arguments);
    set(this, 'currentVerificationCode', this.verificationCode);
  },

  actions: {
    updateVerificationCode(verificationCode) {
      set(this, 'currentVerificationCode', verificationCode);
    },
    updatePassword(password) {
      set(this, 'password', password);
    },
    onSubmit() {
      let {
        username,
        password,
        currentVerificationCode: verificationCode
      } = this;
      this.resetPassword({ username, password, verificationCode });
    }
  }
});
