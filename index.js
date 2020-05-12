'use strict';

module.exports = {
  name: require('./package').name,

  /* isDevelopingAddon() {
    return true;
  }, */

  options: {
    autoImport: {
      exclude: [],
    },
  },

  included() {
    // If tests are not running, make sure pretender is not included
    let app = this._findHost();
    if (!app.tests) {
      this.options.autoImport.exclude.push('pretender');
    }

    this._super.included.apply(this, arguments);
  },
};
