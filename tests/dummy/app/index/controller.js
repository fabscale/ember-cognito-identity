import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  @service cognito;
  @service router;

  get jwtToken() {
    return this.cognito.cognitoData.jwtToken;
  }

  constructor() {
    super(...arguments);

    window.cognito = this.cognito;
  }

  @action
  logout() {
    this.cognito.logout();
    this.router.transitionTo('login');
  }
}
