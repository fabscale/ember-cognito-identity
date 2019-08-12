import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { or } from '@ember/object/computed';

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

  isPending: or(
    'triggerResetPasswordEmailTask.isRunning',
    'resetPasswordTask.isRunning'
  ),

  init() {
    this._super(...arguments);
    set(this, 'selectedUsername', this.username);
    set(this, 'selectedVerificationCode', this.verificationCode);

    if (this.selectedUsername) {
      set(this, 'showPasswordForm', true);
    }
  },

  triggerResetPasswordEmailTask: task(function*(username) {
    let { cognito } = this;

    set(this, 'error', null);

    try {
      yield cognito.triggerResetPasswordMail({ username });
    } catch (error) {
      set(this, 'error', error);
      return;
    }

    set(this, 'selectedUsername', username);
    set(this, 'showPasswordForm', true);
  }),

  resetPasswordTask: task(function*({ username, password, verificationCode }) {
    let { cognito } = this;

    set(this, 'error', null);

    if (!verificationCode || !password || !username) {
      return;
    }

    try {
      yield cognito.updateResetPassword({
        username,
        code: verificationCode,
        newPassword: password
      });
      yield cognito.authenticate({ username, password });
    } catch (error) {
      set(this, 'error', error);
      return;
    }

    this.router.transitionTo(this.cognito.afterLoginRoute);
  }),

  actions: {
    updateUsername(username) {
      set(this, 'selectedUsername', username);
    },

    updateVerificationCode(verificationCode) {
      set(this, 'selectedVerificationCode', verificationCode);
    },

    updatePassword(password) {
      set(this, 'password', password);
    },

    skipTriggerResetPasswordEmail(username) {
      set(this, 'selectedUsername', username);
      set(this, 'error', null);

      set(this, 'showPasswordForm', true);
    },

    resendVerificationCode() {
      set(this, 'showPasswordForm', false);
    }
  }
});
