import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  cognito: service(),

  beforeModel() {
    if (this.cognito.isAuthenticated) {
      this.transitionTo('index');
    }
  }
});
