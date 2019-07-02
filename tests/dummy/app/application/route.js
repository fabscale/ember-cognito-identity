import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  cognito: service(),

  async beforeModel() {
    try {
      await this.cognito.restoreAndLoad();
    } catch (error) {
      // go to login...
    }
  }
});
