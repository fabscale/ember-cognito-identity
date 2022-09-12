import ApplicationInstance from '@ember/application/instance';
import { isTesting } from '@embroider/macros';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';

export function initialize(appInstance: ApplicationInstance): void {
  if (isTesting()) {
    return;
  }

  let cognitoData = mockCognitoData();

  if (!cognitoData) {
    return;
  }

  let cognito = appInstance.lookup('service:cognito') as CognitoService;
  cognito.cognitoData = cognitoData;

  // @ts-ignore
  cognito.userPool.setCurrentUser(cognito.cognitoData.cognitoUser!);
}

export default {
  initialize,
};
