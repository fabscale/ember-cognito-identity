import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import CognitoService from 'ember-cognito-identity/services/cognito';

export default class ApplicationRoute extends Route {
  @service declare cognito: CognitoService;

  async beforeModel(): Promise<void> {
    try {
      await this.cognito.restoreAndLoad();
    } catch (error) {
      // go to login...
    }
  }
}
