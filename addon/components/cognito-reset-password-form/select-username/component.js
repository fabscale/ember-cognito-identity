import Component from '@ember/component';
import layout from './template';
import { set, action } from '@ember/object';

export default class CognitoResetPasswordFormSelectUsername extends Component {
  layout = layout;

  // Attributes
  username = null;

  // Properties
  currentUsernam = null;

  init() {
    super.init(...arguments);

    set(this, 'currentUsername', this.username);
  }

  @action
  updateUsername(username) {
    set(this, 'currentUsername', username);
  }

  @action
  onSubmit() {
    this.triggerResetPasswordEmail(this.currentUsername);
  }
}
