import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  layout,

  cognito: service(),
  router: service(),

  // Attributes
  username: null,
  verificationCode: null,

  // Properties
  password: null,
  selectedUsername: null,
  selectedVerificationCode: null,

  _username: null,

  init() {
    this._super(...arguments);
    set(this, 'selectedUsername', this.username);
    set(this, 'selectedVerificationCode', this.verificationCode);
  },

  actions: {
    updateUsername(event) {
      set(this, '_username', event.srcElement.value);
    },
    updateVerificationCode(event) {
      set(this, 'selectedVerificationCode', event.srcElement.value);
    },
    updatePassword(event) {
      set(this, 'password', event.srcElement.value);
    },

    skipTriggerResetPasswordEmail() {
      set(this, 'selectedUsername', this._username);
      set(this, 'error', null);
    },

    async triggerResetPasswordEmail() {
      let { cognito, _username: username } = this;

      set(this, 'error', null);

      try {
        await cognito.triggerResetPasswordMail({ username });
      } catch (error) {
        set(this, 'error', error);
        return;
      }

      set(this, 'selectedUsername', username);
    },

    async resetPassword() {
      let {
        cognito,
        selectedVerificationCode: verificationCode,
        password,
        selectedUsername: username
      } = this;

      if (!verificationCode || !password) {
        set(this, 'error', 'Please fill in a code and a new password.');
        return;
      }

      set(this, 'error', null);

      try {
        await cognito.updateResetPassword({
          username,
          code: verificationCode,
          newPassword: password
        });
        await cognito.authenticate({ username, password });
      } catch (error) {
        set(this, 'error', error);
        return;
      }

      this.router.transitionTo(this.cognito.afterLoginRoute);
    }
  }
});
