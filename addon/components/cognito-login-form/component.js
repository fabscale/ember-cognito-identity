import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import { NewPasswordRequiredError } from 'ember-cognito-identity/errors/cognito';

export default Component.extend({
  layout,
  cognito: service(),
  router: service(),

  // Properties
  username: null,
  password: null,
  newPassword: null,

  mustEnterNewPassword: false,

  error: null,

  actions: {
    updateUsername(username) {
      set(this, 'username', username);
    },
    updatePassword(password) {
      set(this, 'password', password);
    },
    updateNewPassword(newPassword) {
      set(this, 'newPassword', newPassword);
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
      }
    }
  }
});
