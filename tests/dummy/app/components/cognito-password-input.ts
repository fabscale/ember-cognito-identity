import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { schedule } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';

interface Args {
  value?: string;
  id?: string;
  passwordToggleShowText?: string;
  passwordToggleHideText?: string;
  onChange: Function;
}

export default class CognitoPasswordInput extends Component<Args> {
  // Properties
  @tracked displayType: 'password' | 'text' = 'password';
  inputId: string;

  get passwordToggleText() {
    let toggleIsShow = this.displayType === 'password';

    if (toggleIsShow) {
      return this.args.passwordToggleShowText || 'Show';
    }

    return this.args.passwordToggleHideText || 'Hide';
  }

  constructor(owner: any, args: Args) {
    super(owner, args);

    assert(`onChange must be set`, typeof this.args.onChange === 'function');

    this.inputId = this.args.id || `${guidFor(this)}-input`;
  }

  @action
  onTextChange(event: Event) {
    let element: HTMLInputElement = event.currentTarget as HTMLInputElement;
    let { value } = element;
    this.args.onChange(value);
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
