import CognitoTextInput from 'ember-cognito-identity/components/cognito-text-input/component';
import layout from './template';
import { set, computed } from '@ember/object';
import { schedule } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';

export default CognitoTextInput.extend({
  layout,

  // Additional attributes
  passwordToggleShowText: null,
  passwordToggleHideText: null,
  id: null,

  // Properties
  displayType: 'password',
  inputId: computed('id', function() {
    return this.id || `${guidFor(this)}-input`;
  }),

  passwordToggleText: computed(
    'displayType',
    'passwordToggleShowText',
    'passwordToggleHideText',
    function() {
      let toggleIsShow = this.displayType === 'password';

      if (toggleIsShow) {
        return this.passwordToggleShowText || 'Show';
      }

      return this.passwordToggleHideText || 'Hide';
    }
  ),

  actions: {
    toggleDisplayType() {
      let newDisplayType =
        this.displayType === 'password' ? 'text' : 'password';

      set(this, 'displayType', newDisplayType);

      schedule('afterRender', () => {
        let input = document.getElementById(this.inputId);
        if (input) {
          input.focus();
        }
      });
    }
  }
});
