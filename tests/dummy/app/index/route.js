import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service cognito;
  @service router;

  beforeModel() {
    if (!this.cognito.isAuthenticated) {
      this.router.transitionTo('login');
    }
  }
}
