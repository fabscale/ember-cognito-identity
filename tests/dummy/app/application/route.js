import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service cognito;

  async beforeModel() {
    try {
      await this.cognito.restoreAndLoad();
    } catch (error) {
      // go to login...
    }
  }
}
