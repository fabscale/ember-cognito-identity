import ApplicationInstance from '@ember/application/instance';
import { isTesting } from '@embroider/macros';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';

export function initialize(appInstance: ApplicationInstance): void {
  let data = mockCognitoData();
  if (data && !isTesting()) {
    let cognito = appInstance.lookup('service:cognito') as CognitoService;

    cognito.setupSession(data);
  }
}

export default {
  initialize,
};
