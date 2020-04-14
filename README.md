# ember-cognito-identity

Interact with AWS Cognito from your Ember app.

## Compatibility

- Ember.js v3.16 or above
- Ember CLI v2.13 or above
- Node.js v12 or above

## Installation

```
ember install ember-cognito-identity
```

This expects an .env file (via [ember-cli-dotenv](https://github.com/fivetanley/ember-cli-dotenv) or similar), with the env. variables:

```
COGNITO_USER_POOL_ID=XX
COGNITO_CLIENT_ID=YY
```

And add this to your `config/environment.js`:

```
cognito: {
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID
}
```

## Usage

This addon provides a `cognito` service with some methods to be used to work with AWS Cognito.
In addition, it also provides two contextual & customizable components
to handle the more complex cases of login & password reset.

Generally, your should call `cognito.restoreAndLoad()` in your application route.
This will try to fetch an active user session from local storage and refresh the token, if necessary.
Once this is done, you will know if a user is logged in or not.

This is how this could look in the application route:

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service cognito;

  async beforeModel() {
    try {
      await this.cognito.restoreAndLoad();
    } catch (error) {
      // go to login...
    }
  }
}
```

## Cognito service

The `cognito` service provides promise-ified methods to work with AWS Cognito.

### isAuthenticated

Will be true if a user is currently logged in.
This means that you can safely access `cognitoData` and work with it.

### cognitoData

This property will contain an object with your main Cognito-related information, if the user is logged in.
If the user is not logged in, this will be `null`.

This is an object that looks like this:

```json
{
  "cognitoUser": CognitoUserInstance,
  "cognitoUserSession": CognitoUserSessionInstance,
  "jwtToken": "xxxxx",
  "userAttributes": { "Email": "..." }
}
```

### restoreAndLoad()

Will try to lookup a prior session in local storage and authenticate the user.

If this resolves, you can assume that the user is logged in. It will reject if the user is not logged in.
Call this (and wait for it to complete) in your application route!

### authenticate({ username, password })

Try to login with the given username & password.
Will reject with an Error, or resolve if successfull.

Triggers `onAuthenticated()` on the cognito-service,
which by default redirects to `afterLoginRoute` (`index`, by default).

### logout()

Log out the user from the current device.

Triggers `onUnauthenticated()` on the cognito-service,
which by default redirects to `loginRoute` (`login`, by default).

### invalidateAccessTokens()

Logout & invalidate all issues access tokens (also on other devices).
In contrast, `logout()` does not revoke access tokens, it only removes them locally.

Returns a promise.

### triggerResetPasswordMail({ username })

Trigger an email to get a verification code to reset the password.

Returns a promise.

### updateResetPassword({ username, code, newPassword })

Set a new password for a user.

Returns a promise.

### setNewPassword({ username, password, newPassword })

Set a new password, if a user requires a new password to be set (e.g. after an admin created the user).

Returns a promise.

### updatePassword({ oldPassword, newPassword })

Update the password of the currently logged in user.

Returns a promise.

## Example

You can find example components in the dummy app to see how a concrete implementation could look like.

## Testing

You can use the provided test helpers for testing.

Note that all async methods on the Cognito service will automatically register test waiters,
so calling `settled()` will wait for them to complete.

### Mocking a logged in state

```js
import { mockCognito } from 'ember-cognito-identity/test-support/helpers/mock-cognito';

test('test helper correctly mocks a cognito session', async function (assert) {
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
  setupPretenderNeedsInitialPassword,
} from 'ember-cognito-identity/test-support/pretender/login';
import { setupPretenderResetPassword } from 'ember-cognito-identity/test-support/pretender/reset-password';

module('test cognito processes', function (hooks) {
  setupCognitoMocks(hooks);

  test('test login', async function (assert) {
    setupPretenderSuccessfulLogin(this);
    let { cognitoAccessToken } = this;

    // Now fill into login fields and submit the form, at the end the `cognitoAccessToken` will be set
  });

  test('test failed login', async function (assert) {
    setupPretenderInvalidPassword(this);
    // ...
  });

  test('test user with required password change', async function (assert) {
    setupPretenderNeedsInitialPassword(this);
    // ...
  });

  test('resetting password', async function (assert) {
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

module('test cognito processes', function (hooks) {
  hooks.beforeEach(function () {
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
