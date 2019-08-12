import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = class DummyRouter extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
};

Router.map(function() {
  this.route('login');
  this.route('logout');
  this.route('reset-password');
});

export default Router;
