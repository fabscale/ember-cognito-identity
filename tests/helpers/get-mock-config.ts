import { getConfig, getOwnConfig } from '@embroider/macros';

export function getMockConfig(): {
  enableMocks: boolean;
  mockUsername: string;
  mockPassword: string;
  mockCode: number;
  mockJwtToken: string;
} {
  // In order for this to work in both embroider & classic builds, we need to handle both
  // See: https://github.com/embroider-build/embroider/issues/537
  // It _should_ be getConfig()
  let config: {
    enableMocks: boolean;
    mockUsername: string;
    mockPassword: string;
    mockCode: number;
    mockJwtToken: string;
  } = getConfig('ember-cognito-identity') || getOwnConfig<any>();

  return config;
}
