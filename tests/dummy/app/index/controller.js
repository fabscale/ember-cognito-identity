import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  @service cognito;

  @reads('cognito.cognitoData.jwtToken') jwtToken;

  @action
  logout() {
    this.cognito.logout();
  }
}
