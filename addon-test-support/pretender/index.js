import Pretender from 'pretender';
import { set } from '@ember/object';

export function setupCognitoMocks(hooks) {
  hooks.beforeEach(function () {
    let cognito = this.owner.lookup('service:cognito');

    set(cognito, 'config.clientId', 'TEST-CLIENT-ID');
    set(cognito, 'config.userPoolId', 'eu-west-1_testuserpool');

    this.cognito = cognito;
    this.cognitoStorage = {
      _data: {},
      clear() {
        this._data = {};
        return this._data;
      },

      getItem(key) {
        return this._data[key];
      },

      setItem(key, value) {
        this._data[key] = value;
        return value;
      },

      removeItem(key) {
        delete this._data[key];
      },
    };

    cognito._cognitoStorage = this.cognitoStorage;

    this.awsHooks = {};

    if (!this.cognitoPretenderServer) {
      this.cognitoPretenderServer = new Pretender(function () {});
    }

    setupCognitoPrentenderRoute(this, this.cognitoPretenderServer);
  });

  hooks.afterEach(function () {
    this.cognitoPretenderServer.shutdown();
  });
}

export function setupCognitoPrentenderRoute(context, pretenderServer) {
  pretenderServer.post(
    'https://cognito-idp.eu-west-1.amazonaws.com',
    function (request) {
      let { requestHeaders } = request;
      let requestBody = JSON.parse(request.requestBody);
      let awsTarget =
        requestHeaders['x-amz-target'] || requestHeaders['X-Amz-Target'];

      let hook = context.awsHooks[awsTarget];
      if (!hook) {
        throw new Error(`hook "${awsTarget}" is not defined on this.awsHooks.`);
      }

      let response = hook(requestBody);
      if (Array.isArray(response)) {
        let [status, headers, body] = response;

        return [
          status,
          headers,
          typeof body === 'object' ? JSON.stringify(body) : body,
        ];
      }

      return [200, {}, JSON.stringify(response)];
    }
  );
}

export default setupCognitoMocks;
