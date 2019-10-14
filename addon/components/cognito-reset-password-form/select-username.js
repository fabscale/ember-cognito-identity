import Component from '@ember/component';
import { set, action } from '@ember/object';

export default class CognitoResetPasswordFormSelectUsername extends Component {
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
