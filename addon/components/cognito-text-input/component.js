import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  layout,
  tagName: '',

  // Attributes
  value: null,
  onChange: null,

  actions: {
    onChange(event) {
      let { value } = event.srcElement;
      this.onChange(value);
    }
  }
});
