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

  showPasswordForm: false,

  init() {
    this._super(...arguments);
    set(this, 'selectedUsername', this.username);
    set(this, 'selectedVerificationCode', this.verificationCode);

    if (this.selectedUsername) {
      set(this, 'showPasswordForm', true);
    }
  },

  actions: {
    skipTriggerResetPasswordEmail(username) {
      set(this, 'selectedUsername', username);
      set(this, 'error', null);

      set(this, 'showPasswordForm', true);
    },

    async triggerResetPasswordEmail(username) {
      console.log(username);
      let { cognito } = this;

      set(this, 'error', null);

      try {
        await cognito.triggerResetPasswordMail({ username });
      } catch (error) {
        set(this, 'error', error);
        return;
      }

      set(this, 'selectedUsername', username);
      set(this, 'showPasswordForm', true);
    },

    resendVerificationCode() {
      set(this, 'showPasswordForm', false);
    },

    async resetPassword({ username, password, verificationCode }) {
      let { cognito } = this;

      if (!verificationCode || !password || !username) {
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
