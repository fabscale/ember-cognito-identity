import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

interface Args {
  value?: string;
  onChange: Function;
}

export default class CognitoTextInput extends Component<Args> {
  constructor(owner: any, args: Args) {
    super(owner, args);

    assert(`onChange must be set`, typeof this.args.onChange === 'function');
  }

  @action
  onTextChange(event: Event) {
    let element: HTMLInputElement = event.currentTarget as HTMLInputElement;
    let { value } = element;
    this.args.onChange(value);
  }
}
