import { getOwnConfig, macroCondition } from '@embroider/macros';

interface Args {
  jwtToken?: string;
}

class MockCognitoUserSession {
  #jwtToken = getOwnConfig<any>().mockJwtToken;
  #expirationDate: Date;

  constructor({ jwtToken }: Args = {}) {
    if (jwtToken) {
      this.#jwtToken = jwtToken;
    }

    this.#expirationDate = new Date(+new Date() + 1000 * 60 * 60);
  }

  getAccessToken() {
    return {
      getJwtToken: () => {
        return this.#jwtToken;
      },

      getExpiration: () => {
        return Math.floor(+this.#expirationDate / 1000);
      },
    };
  }

  getIdToken() {
    return this.getAccessToken();
  }

  get refreshToken() {
    return {
      getToken: () => {
        return `${this.#jwtToken}-REFRESH`;
      },
    };
  }

  setExpireIn(seconds: number) {
    this.#expirationDate = new Date(+new Date() + 1000 * seconds);
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
