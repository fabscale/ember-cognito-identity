import CognitoTextInput from '@fabscale/ember-cognito-identity/components/cognito-text-input';
import { action } from '@ember/object';
import { schedule } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';

export default class CognitoPasswordInput extends CognitoTextInput {
  // Additional attributes
  @tracked passwordToggleShowText;
  @tracked passwordToggleHideText;
  id = null;

  // Properties
  @tracked displayType = 'password';
  inputId;

  get passwordToggleText() {
    let toggleIsShow = this.displayType === 'password';

    if (toggleIsShow) {
      return this.passwordToggleShowText || 'Show';
    }

    return this.passwordToggleHideText || 'Hide';
  }

  init() {
    super.init(...arguments);

    this.inputId = this.id || `${guidFor(this)}-input`;
  }

  @action
  toggleDisplayType() {
    this.displayType = this.displayType === 'password' ? 'text' : 'password';

    schedule('afterRender', () => {
      let input = document.getElementById(this.inputId);
      if (input) {
        input.focus();
      }
    });
  }
}
