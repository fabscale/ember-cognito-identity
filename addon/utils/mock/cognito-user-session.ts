import { getOwnConfig, macroCondition } from '@embroider/macros';

interface Args {
  jwtToken?: string;
}

class MockCognitoUserSession {
  #jwtToken = getOwnConfig<any>().mockJwtToken;

  constructor({ jwtToken }: Args = {}) {
    if (jwtToken) {
      this.#jwtToken = jwtToken;
    }
  }

  getAccessToken() {
    return {
      getJwtToken: () => {
        return this.#jwtToken;
      },
    };
  }

  get refreshToken() {
    return {
      getToken: () => {
        return `${this.#jwtToken}-REFRESHED`;
      },
    };
  }
}

export function mockCognitoUserSession(
  args?: Args
): MockCognitoUserSession | undefined {
  if (macroCondition(getOwnConfig<any>().enableMocks)) {
    return new MockCognitoUserSession(args);
  }

  return undefined;
}
