import CognitoTextInput from '@fabscale/ember-cognito-identity/components/cognito-text-input';
import { action } from '@ember/object';
import { schedule } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';

export default class CognitoPasswordInput extends CognitoTextInput {
  /*
   * Attributes:
   *  - value
   *  - onChange
   *  - passwordToggleShowText
   *  - passwordToggleHideText
   *  - id
   */

  // Properties
  @tracked displayType = 'password';
  inputId;

  get passwordToggleText() {
    let toggleIsShow = this.displayType === 'password';

    if (toggleIsShow) {
      return this.args.passwordToggleShowText || 'Show';
    }

    return this.args.passwordToggleHideText || 'Hide';
  }

  constructor() {
    super(...arguments);

    this.inputId = this.args.id || `${guidFor(this)}-input`;
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
