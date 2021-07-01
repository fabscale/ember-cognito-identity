import ApplicationInstance from '@ember/application/instance';
import { isTesting } from '@embroider/macros';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';

export function initialize(appInstance: ApplicationInstance): void {
  let cognitoData = mockCognitoData();
  if (cognitoData && !isTesting()) {
    let cognito = appInstance.lookup('service:cognito') as CognitoService;
    cognito.cognitoData = cognitoData;
  }
}

export default {
  initialize,
};
