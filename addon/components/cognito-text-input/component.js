import Component from '@ember/component';
import layout from './template';
import { assert } from '@ember/debug';

export default Component.extend({
  layout,
  tagName: '',

  // Attributes
  value: null,
  onChange: null,

  init() {
    this._super(...arguments);

    assert(`onChange must be set`, this.onChange);
  },

  actions: {
    onChange(event) {
      let { value } = event.srcElement;
      this.onChange(value);
    }
  }
});
