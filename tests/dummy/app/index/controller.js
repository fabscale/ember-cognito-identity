import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Controller.extend({
  cognito: service(),

  jwtToken: reads('cognito.cognitoData.jwtToken'),

  actions: {
    logout() {
      this.cognito.logout();
    }
  }
});
