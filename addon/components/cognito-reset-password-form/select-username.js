import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CognitoResetPasswordFormSelectUsername extends Component {
  /*
   * Attributes:
   *  - username
   *  - triggerResetPasswordEmail
   */

  // Properties
  @tracked currentUsername;

  constructor() {
    super(...arguments);

    this.currentUsername = this.args.username;
  }

  @action
  updateUsername(username) {
    this.currentUsername = username;
  }

  @action
  onSubmit() {
    this.args.triggerResetPasswordEmail(this.currentUsername);
  }
}
