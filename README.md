# ember-cognito-identity

Interact with AWS Cognito from your Ember app.

This uses `amazon-cognito-identity-js` under the hood, which is considerably smaller in footprint than the quite enormous AWS Amplify SDK.
If all you need is a way to work with the JWT tokens priovded by Cognito, then this addon is perfect for you.

## Compatibility

- Ember.js v3.16 or above
- Ember CLI v2.13 or above
- Node.js v12 or above

## Installation

```
ember install ember-cognito-identity
```

And add this to your `config/environment.js`:

```
cognito: {
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID
}
```

You can configure these e.g. via an .env file, for example via [ember-cli-dotenv](https://github.com/fivetanley/ember-cli-dotenv).

## Usage

This addon provides a `cognito` service with some methods to be used to work with AWS Cognito.

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

After logging in (see below) you can access the JTW token like this:

```js
let token = this.cognito.cognitoData.jwtToken;
```

Here is a summary of the most important available methods - all methods return a promise:

```js
cognito.restoreAndLoad();
cognito.authenticate({ username, password });
cognito.logout();
cognito.invalidateAccessTokens();
cognito.triggerResetPasswordMail({ username });
cognito.updateResetPassword({ username, code, newPassword });
cognito.setNewPassword({ username, password, newPassword });
cognito.updatePassword({ oldPassword, newPassword });
cognito.updateAttributes(attributeMap);
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

```js
let cognitoData = {
  cognitoUser: CognitoUser,
  cognitoUserSession: CognitoUserSession,
  jwtToken: 'xxxxx',
  userAttributes: { Email: '...' },
  mfa: {
    enable: () => {},
    disable: () => {},
    isEnabled: () => {},
    setupDevice: () => {},
    verifyDevice: (code) => {},
  },
};
```

### restoreAndLoad()

Will try to lookup a prior session in local storage and authenticate the user.

If this resolves, you can assume that the user is logged in. It will reject if the user is not logged in.
Call this (and wait for it to complete) in your application route!

### authenticate({ username, password })

Try to login with the given username & password.
Will reject with an Error, or resolve if successfull.

### logout()

Log out the user from the current device.

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

## Token expiration

This addon will automatically refresh the JWT Token every 45 minutes.
The tokens have a lifespan of 60 minutes, so this should ensure that the local token never experies in the middle of a session.

## Multi-Factor Authentication (MFA)

This addon allows you to work with optional TOTP (Temporary One Time Password) MFA.
SMS-based MFA is not supported for now (to reduce complexity, and since it is less secure than TOTP).

You will need to enable TOTP-based MFA in your Cognito user pool first.

Using MFA in your app requires changes in two places: The sign in process, and allowing users to opt into MFA.

### Setting up MFA

A user can opt into MFA for their own account. For this, you can use the `mfa` object on the `cognitoData` object:

```js
let { mfa } = this.cognito.cognitoData;

// Available methods
await mfa.enable();
await mfa.disable();
await mfa.isEnabled();
await mfa.setupDevice();
await mfa.verifyDevice(token);
```

To do so requires the following steps:

```js
let secret = await mfa.setupDevice();
```

The secret is the code needed to set up your TOTP app, e.g. Google or Microsoft Authenticator.
Users can either enter this code manually (which is pretty tedious as it is a very long code), or most apps also allow to scan a QR code.

You can use the included util to generate a fitting URL for your QR code like this:

```js
import { generateMfaQrCodeUrl } from 'ember-cognito-identity/utils/mfa-qr-code';

let url = generateMfaQrCodeUrl({
  user: 'my-email@test.com',
  label: 'My App Name',
  secret,
});
```

And generate a QR code with any QR code library, e.g. using [qrcode](https://github.com/soldair/node-qrcode) & ember-auto-import:

```js
import QRCode from 'qrcode';

QRCode.toCanvas(canvasElement, url);
```

After users scan this QR code, they will have your app setup in their Authenticator app.
Finally, users have to enter a generated code from the Authenticator back into your app:

```js
// token is the 6-digit code from the Authenticator
await mfa.verifyDevice(token);
// if that was successfull, enable MFA for this user
await mfa.enable();
```

After it is setup, you can always disable MFA again:

```js
await mfa.disable();
```

Note that Cognito does not provide a MFA recovery process. If a user looses access to their MFA device, an administrator will have to reset MFA for them.

### Signing in with MFA

When a user signs in with MFA, `authenticate()` will throw a `MfaCodeRequiredError` error that you have to handle, e.g. like this:

```js
import { MfaCodeRequiredError } from 'ember-cognito-identity/errors/cognito';

try {
  cognito.authenticate({ username, password });
} catch (error) {
  if (error instanceof MfaCodeRequiredError) {
    this.mustEnterMfaCode = true;
    return;
  }

  throw error;
}
```

You'll need to prompt the user to enter the 6-digit code, and then call `mfaCompleteAuthentication`:

```js
await this.cognito.mfaCompleteAuthentication(mfaCode);
```

After that, the user will be signed in (or it will throw an error if the MFA code is incorrect).

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

Alternatively, you can also use `mockCognitoData` to build your own state, like this:

```js
import { mockCognitoData } from 'ember-cognito-identity/test-support/helpers/mock-cognito-data';

test('test helper correctly mocks a cognito session', async function (assert) {
  let cognito = this.owner.lookup('service:cognito');
  let cognitoData = mockCognitoData({ accessToken: 'TEST-ACCESS-TOKEN' });\
  // Maybe edit the data here?
  cognito.cognitoData = cognitoData;
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
