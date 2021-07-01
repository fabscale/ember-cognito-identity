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
cognito.authenticateUser({ username, password });
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

### authenticateUser({ username, password })

Verify only the given username & password.
This will _not_ sign the user in, but can be used to e.g. guard special places in your app behind a repeated password check.
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

## Mocking Cognito

You might want to mock Cognito either for testing or for development/demoing.
For these cases, this addon provides helpful utilities.

In order for the Cognito mocking to work, you will need to enable mocks.
You can do that in your `ember-cli-build.js`:

```js
let app = new EmberApp(defaults, {
  '@embroider/macros': {
    setConfig: {
      'ember-cognito-identity': {
        // If this is set to true, mock classes will be included in the build & used for all processes
        enableMocks: true,

        // Optional overwrite these defaults to your liking
        mockUsername: 'jane@example.com',
        mockPassword: 'test1234',
        mockCode: 123456,
        mockJwtToken: 'TEST-ACCESS-TOKEN-AUTO',
      },
    },
  },
});
```

For example, if you want to use mocks only when testing, you could configure it like this:

```js
let env = process.env.EMBER_ENV || 'development';

let app = new EmberApp(defaults, {
  '@embroider/macros': {
    setConfig: {
      'ember-cognito-identity': {
        enableMocks: env === 'test',
      },
    },
  },
});
```

### Mocked processes

When mocks are enabled, the cognito service will not hit any API but will handle all processes locally by mocked classes.

You will be able to normally do all processes, like signing in, resetting your password, etc.

The mocks will validate all input based on the configuration. The defaults are:

- mockUsername: `'jane@example.com'`,
- mockPassword: `'test1234'`,
- mockCode: `123456`,
- mockJwtToken: `'TEST-ACCESS-TOKEN-AUTO'`,

This means, if you try to sign in with a different username or password you will get an error.
This can be used to test various states.
The `mockCode` is used for both MFA authorization as well as for password resetting.

### Mocking specific processes

There are two special cases that you can manually opt-in to, e.g. for testing purposes: Requiring an MFA code or a new password.

To trigger these processes, you can do the following:

```js
import { MOCK_COGNITO_CONFIG } from 'ember-cognito-identity/utils/mocks/cognito-user';

test('it works with MFA code required', function (assert) {
  MOCK_COGNITO_CONFIG.mustEnterMfaCode = true;

  // test it

  // make sure to reset it afterwards
  MOCK_COGNITO_CONFIG.mustEnterMfaCode = false;
});

test('it works with new password required', function (assert) {
  MOCK_COGNITO_CONFIG.mustEnterNewPassword = true;

  // test it

  // make sure to reset it afterwards
  MOCK_COGNITO_CONFIG.mustEnterNewPassword = false;
});
```

### Generating mocked data

You can generate mocked cognitoData with the provided utils:

```js
import ApplicationInstance from '@ember/application/instance';
import { isTesting } from '@embroider/macros';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';

export function initialize(appInstance: ApplicationInstance): void {
  let cognitoData = mockCognitoData();
  if (cognitoData) {
    let cognito = appInstance.lookup('service:cognito');
    cognito.cognitoData = cognitoData;
  }
}

export default {
  initialize,
};
```

Note that `mockCognitoData()` (and all other utils it uses under the hood) will return `undefined` if mocks are not enabled.
In that case, all the mocking code is stripped out and the utils remain as empty wrappers only.

The above example would automatically sign a user in with a simulated user when running the app with mocks enabled.

You can also provide some configuration to `mockCognitoData`:

```js
let cognitoData = mockCognitoData({
  username = 'my-custom-user@test.com',
  // To test states with enabled or disabled MFA
  mfaEnabled = false,
});
```

## Testing

You can use the provided test helpers for testing.

Note that all async methods on the Cognito service will automatically register test waiters,
so calling `settled()` will wait for them to complete.

### Mocking a logged in state

```js
import { mockCognitoAuthenticated } from 'ember-cognito-identity/test-support/helpers/mock-cognito';

module('my-module', function (hooks) {
  mockCognitoAuthenticated(hooks);
});
```

You can optionally also provide some additional configuration:

```js
 mockCognitoAuthenticated(hooks, {
  // If this is true, it will include assert.step() invocations for all cognito steps
  // This can be useful to test that the correct cognito stuff is happening behind the scenes
  includeAssertSteps = true,
  // If you need your user to be signed in with a special username
  username = 'my-custom-user@test.com',
 });
```

This uses `mockCognitoData` under the hood, and sets everything up correctly.

Alternatively, you can also use `mockCognitoData` to build your own state, like this:

```js
import { mockCognitoData } from 'ember-cognito-identity/utils/mock/cognito-data';

test('test helper correctly mocks a cognito session', async function (assert) {
  let cognito = this.owner.lookup('service:cognito');

  let cognitoData = mockCognitoData({
    username = 'my-custom-user@test.com',
    mfaEnabled = false,
    // If you pass in `assert`, it will include assert.step() invocations for all cognito steps
    assert,
  });

  cognito.cognitoData = cognitoData;
});
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
