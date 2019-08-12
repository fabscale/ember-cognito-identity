import Component from '@ember/component';
import layout from './template';
import { set } from '@ember/object';

export default Component.extend({
  layout,

  // Attributes
  username: null,

  // Properties
  currentUsername: null,

  init() {
    this._super(...arguments);
    set(this, 'currentUsername', this.username);
  },

  actions: {
    updateUsername(username) {
      set(this, 'currentUsername', username);
    },

    onSubmit() {
      this.triggerResetPasswordEmail(this.currentUsername);
    }
  }
});
