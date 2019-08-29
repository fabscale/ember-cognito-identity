'use strict';
const path = require('path');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  options: {
    autoImport: {
      exclude: []
    }
  },

  included() {
    // If tests are not running, make sure pretender is not included
    let app = this._findHost();
    if (!app.tests) {
      this.options.autoImport.exclude.push('pretender');
    }

    this._super.included.apply(this, arguments);

    this.import('vendor/amazon-cognito-identity-js/amazon-cognito-identity.js');
  },

  treeForVendor(vendorTree) {
    let amazonCognitoIdentityJsPath = this._getPath();

    let trees = [];
    if (vendorTree) {
      trees.push(vendorTree);
    }

    let amazonCognitoIdentityJsTree = new Funnel(amazonCognitoIdentityJsPath, {
      destDir: 'amazon-cognito-identity-js'
    });

    trees.push(amazonCognitoIdentityJsTree);

    return new MergeTrees(trees, { overwrite: true });
  },

  _getPath() {
    let basePath = path.dirname(require.resolve('amazon-cognito-identity-js'));

    // The path returned here is e.g. node_modules/amazon-cognito-identity-js/lib
    // We want to move one step out to get the dist folder
    return basePath.replace('/lib', '/dist').replace('\\lib', '\\dist');
  }
};
