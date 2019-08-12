import Component from '@ember/component';
import layout from './template';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

export default class CognitoTextInput extends Component {
  layout = layout;
  tagName = '';

  // Attributes
  value = null;
  onChange = null;

  init() {
    super.init(...arguments);

    assert(`onChange must be set`, this.onChange);
  }

  @action
  onTextChange(event) {
    let { value } = event.srcElement;
    this.onChange(value);
  }
}
