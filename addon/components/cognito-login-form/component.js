import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import { NewPasswordRequiredError } from 'ember-cognito-identity/errors/cognito';
import { task } from 'ember-concurrency';

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

  submitFormTask: task(function*() {
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
        yield cognito.setNewPassword({ username, password, newPassword });
      } catch (error) {
        set(this, 'error', error);
        return;
      }

      password = newPassword;
    }

    if (!username || !password) {
      return;
    }

    try {
      yield cognito.authenticate({ username, password });
    } catch (error) {
      if (error instanceof NewPasswordRequiredError) {
        set(this, 'mustEnterNewPassword', true);
        return;
      }

      set(this, 'error', error);
    }
  }).drop(),

  actions: {
    updateUsername(username) {
      set(this, 'username', username);
    },

    updatePassword(password) {
      set(this, 'password', password);
    },

    updateNewPassword(newPassword) {
      set(this, 'newPassword', newPassword);
    }
  }
});
