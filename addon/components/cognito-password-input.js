import CognitoTextInput from '@fabscale/ember-cognito-identity/components/cognito-text-input';
import { set, computed, action } from '@ember/object';
import { schedule } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';

export default class CognitoPasswordInput extends CognitoTextInput {
  // Additional attributes
  passwordToggleShowText = null;
  passwordToggleHideText = null;
  id = null;

  // Properties
  displayType = 'password';

  @computed('id')
  get inputId() {
    return this.id || `${guidFor(this)}-input`;
  }

  @computed('displayType', 'passwordToggleShowText', 'passwordToggleHideText')
  get passwordToggleText() {
    let toggleIsShow = this.displayType === 'password';

    if (toggleIsShow) {
      return this.passwordToggleShowText || 'Show';
    }

    return this.passwordToggleHideText || 'Hide';
  }

  @action
  toggleDisplayType() {
    let newDisplayType = this.displayType === 'password' ? 'text' : 'password';

    set(this, 'displayType', newDisplayType);

    schedule('afterRender', () => {
      let input = document.getElementById(this.inputId);
      if (input) {
        input.focus();
      }
    });
  }
}
