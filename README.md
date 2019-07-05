# ember-cognito-identity

Interact with AWS Cognito from your Ember app.

## Installation

```
ember install ember-cognito-identity
```

This expects an .env file (via [ember-cli-dotenv](https://github.com/fivetanley/ember-cli-dotenv) or similar), with the env. variables:

```
COGNITO_USER_POOL_ID=XX
COGNITO_CLIENT_ID=YY
```

## Usage

TODO

## Testing

You can use the provided test helpers for testing.

### Mocking a logged in state

```js
import { mockCognito } from 'ember-cognito-identity/test-support/helpers/mock-cognito';

test('test helper correctly mocks a cognito session', async function(assert) {
  mockCognito(this, { accessToken: 'TEST-ACCESS-TOKEN' });

  await visit('/');

  let cognito = this.owner.lookup('service:cognito');

  assert.equal(
    cognito.cognitoData.jwtToken,
    'TEST-ACCESS-TOKEN',
    'correct dummy access token is generated'
  );
});
```

### Mocking Cognito processes

If necessary, you can also mock Cognito processes.
This actually uses Pretender under the hood and mocks the API endpoints for Cognito.

Using this requires some additional setup in your application:

- Install ember-auto-import & Pretender (`ember install ember-auto-import` && `npm install pretender --dev`)
- or install ember-cli-pretender: `ember install ember-cli-pretender`

This will not add anything to your production build.

```js
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';
import {
  setupPretenderSuccessfulLogin,
  setupPretenderInvalidPassword,
  setupPretenderNeedsInitialPassword
} from 'ember-cognito-identity/test-support/pretender/login';
import { setupPretenderResetPassword } from 'ember-cognito-identity/test-support/pretender/reset-password';

module('test cognito processes', function(hooks) {
  setupCognitoMocks(hooks);

  test('test login', async function(assert) {
    setupPretenderSuccessfulLogin(this);
    let { cognitoAccessToken } = this;

    // Now fill into login fields and submit the form, at the end the `cognitoAccessToken` will be set
  });

  test('test failed login', async function(assert) {
    setupPretenderInvalidPassword(this);
    // ...
  });

  test('test user with required password change', async function(assert) {
    setupPretenderNeedsInitialPassword(this);
    // ...
  });

  test('resetting password', async function(assert) {
    setupPretenderResetPassword(this);
    // ...
  });
});
```

#### Usage with ember-cli-mirage

Using `setupCognitoMocks(hooks)` will setup & tear down a Pretender server for you before/after each test.
If you use ember-cli-mirage, that will conflict with the mirage pretender server.

In this case, you can set up the Cognito mocks like this:

```js
import { setupCognitoMocks } from 'ember-cognito-identity/test-support/pretender';

module('test cognito processes', function(hooks) {
  hooks.beforeEach(function() {
    this.cognitoPretenderServer = this.server;
  });
  setupCognitoMocks(hooks);
});
```

This instructs Cognito to register it's handlers on an existing Pretender server instance.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
