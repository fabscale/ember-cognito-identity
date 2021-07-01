import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';
import { assert } from '@ember/debug';
import { getOwnConfig } from '@embroider/macros';
import CognitoService from 'ember-cognito-identity/services/cognito';

export function mockCognitoAuthenticated(
  hooks: any,
  {
    includeAssertSteps = false,
    jwtToken = getOwnConfig<any>().mockJwtToken,
    username = getOwnConfig<any>().mockUsername,
  }: {
    includeAssertSteps?: boolean;
    jwtToken?: string;
    username?: string;
  } = {}
) {
  assert(
    `You have to set enableMocks=true in your ember-cli-build.js file:

'@embroider/macros': {
  setConfig: {
    'ember-cognito-identity': {
      enableMocks: true
    },
  },
},
`,
    getOwnConfig<any>().enableMocks
  );

  hooks.beforeEach(function (this: any, assert: any) {
    let cognito = this.owner.lookup('service:cognito') as CognitoService;

    cognito.cognitoData = mockCognitoData({
      jwtToken,
      username,
      assert: includeAssertSteps ? assert : undefined,
    })!;

    // @ts-ignore
    cognito.userPool.setCurrentUser(cognito.cognitoData.cognitoUser!);

    if (includeAssertSteps) {
      cognito._assert = assert;
    }

    this.cognito = cognito;
  });
}

export function mockCognito() {
  assert(`'mockCognito' has been replaced with 'mockCognitoAuthenticated'. Use it like this:
  
mockCognitoAuthenticated(hooks);
`);
}

export default mockCognito;
