import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

export default class CognitoTextInput extends Component {
  /*
   * Attributes:
   *  - value
   *  - onChange
   */

  constructor() {
    super(...arguments);

    assert(`onChange must be set`, typeof this.args.onChange === 'function');
  }

  @action
  onTextChange(event) {
    let { value } = event.srcElement;
    this.args.onChange(value);
  }
}
