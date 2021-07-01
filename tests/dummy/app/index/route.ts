import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RouterService from '@ember/routing/router-service';
import CognitoService from 'ember-cognito-identity/services/cognito';

export default class IndexRoute extends Route {
  @service cognito: CognitoService;
  @service router: RouterService;

  beforeModel(): void {
    if (!this.cognito.isAuthenticated) {
      this.router.transitionTo('login');
    }
  }
}
