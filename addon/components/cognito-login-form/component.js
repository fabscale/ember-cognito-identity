import Component from '@ember/component';
import layout from './template';
import { set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { assign } from '@ember/polyfills';
import { NewPasswordRequiredError } from 'ember-cognito-identity/errors/cognito';

export default Component.extend({
  layout,
  cognito: service(),
  router: service(),

  // Attributes
  messages: null,

  // Properties
  username: null,
  password: null,
  newPassword: null,

  actualMessages: null,
  mustEnterNewPassword: false,

  error: null,
  resetPasswordRoute: reads('cognito.resetPasswordRoute'),

  defaultMessages: computed(function() {
    return {
      username: 'E-mail',
      password: 'Password',
      newPassword: 'New password',
      submit: 'Submit',
      resetPassword: 'Password forgotten?',
      pleaseFillInRequired: 'Please fill in an email and a password.',
      newPasswordMessage: 'You must set a new password in order to continue.'
    };
  }),

  init() {
    this._super(...arguments);

    this._setupMessages();
  },

  actions: {
    updateUsername(event) {
      set(this, 'username', event.srcElement.value);
    },
    updatePassword(event) {
      set(this, 'password', event.srcElement.value);
    },
    updateNewPassword(event) {
      set(this, 'newPassword', event.srcElement.value);
    },

    async submitForm() {
      let {
        cognito,
        username,
        password,
        newPassword,
        mustEnterNewPassword
      } = this;

      set(this, 'error', null);

      if (mustEnterNewPassword) {
        try {
          await cognito.setNewPassword({ username, password, newPassword });
        } catch (error) {
          set(this, 'error', error);
          return;
        }

        password = newPassword;
      }

      if (!username || !password) {
        set(this, 'error', this.actualMessages.pleaseFillInRequired);
        return;
      }

      try {
        await cognito.authenticate({ username, password });
      } catch (error) {
        if (error instanceof NewPasswordRequiredError) {
          set(this, 'mustEnterNewPassword', true);
          return;
        }

        set(this, 'error', error);
        return;
      }
    }
  },

  _setupMessages() {
    let { messages, defaultMessages } = this;
    let mergedMessages = assign({}, defaultMessages, messages);
    set(this, 'actualMessages', mergedMessages);
  }
});
