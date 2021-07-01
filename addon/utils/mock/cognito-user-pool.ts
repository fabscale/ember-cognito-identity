import { getOwnConfig, macroCondition } from '@embroider/macros';

interface Args {
  cognitoUser?: any;
}

class MockCognitoUserPool {
  #cognitoUser: any;

  constructor({ cognitoUser }: Args = {}) {
    this.#cognitoUser = cognitoUser;
  }

  getCurrentUser() {
    return this.#cognitoUser;
  }

  setCurrentUser(cognitoUser: any) {
    this.#cognitoUser = cognitoUser;
  }
}

export function mockCognitoUserPool(
  args?: Args
): MockCognitoUserPool | undefined {
  if (macroCondition(getOwnConfig<any>().enableMocks)) {
    return new MockCognitoUserPool(args);
  }

  return undefined;
}
