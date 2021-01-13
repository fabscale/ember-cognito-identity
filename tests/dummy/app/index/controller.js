import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  @service cognito;

  get jwtToken() {
    return this.cognito.cognitoData.jwtToken;
  }

  @action
  logout() {
    this.cognito.logout();
  }
}
