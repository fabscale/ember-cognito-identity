import { getOwnConfig, macroCondition } from '@embroider/macros';

class MockCognitoUserPool {
  #cognitoUser: any;

  getCurrentUser() {
    return this.#cognitoUser;
  }

  setCurrentUser(cognitoUser: any) {
    this.#cognitoUser = cognitoUser;
  }
}

export function mockCognitoUserPool(): MockCognitoUserPool | undefined {
  if (macroCondition(getOwnConfig<any>().enableMocks)) {
    return new MockCognitoUserPool();
  }

  return undefined;
}
