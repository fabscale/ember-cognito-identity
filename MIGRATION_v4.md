# Migration from v3.x to v4.x

When upgrading from v3 to v4, there are a few things to consider.

## Changed method locations:

- `cognito.restoreAndLoad()` remains the same;
- `cognito.authenticate()` remains the same;
- `cognito.authenticateUser()` --> `cognito.unauthenticated.verifyUserAuthentication()`
- `cognito.logout()` --> remains the same
- `cognito.invalidateAccessTokens()` --> remains the same
- `cognito.triggerResetPasswordMail()` --> `cognito.unauthenticated.triggerResetPasswordMail()`
- `cognito.updateResetPassword()` --> `cognito.unauthenticated.updateResetPassword()`
- `cognito.setNewPassword()` --> `cognito.unauthenticated.setInitialPassword()`
- `cognito.updatePassword()` --> `cognito.user.updatePassword()`
- `cognito.updateAttributes()` --> `cognito.user.updateAttributes()`
- `cognito.cognitoData.mfa` --> `cognito.user.mfa`
- `cognito.cognitoData.cognitoUser` --> `cognito.user.cognitoUser`
- `cognito.cognitoData.cognitoUserSession` --> `cognito.session.cognitoUserSession`
- `cognito.cognitoData.jwtToken` --> `cognito.session.jwtToken`
- `cognito.cognitoData.userAttributes` --> `cognito.user.userAttributes`
- `cognito.cognitoData.getAccessToken()` --> `cognito.session.getAccessToken()`
- `cognito.cognitoData.getIdToken()` --> `cognito.session.getIdToken()`
- `cognito.refreshAccessToken()` --> `cognito.session.refresh()`

## `cognitoData` is no more

As you can see in the above section, `cognito.cognitoData` has been replaced with `cognito.user` and `cognito.session`.

These two properties will be set when the user is authenticated, else they will be `undefined`. When `isAuthenticated === true` you can assume they are set.

In contrast, `unauthenticated` is _always_ available.

## Change token auto-refresh

In 4.x, JWT tokens will _not_ be automatically refreshed when they expire.
Instead, you can call `cognito.session.enableAutoRefresh()` and `cognito.session.disableAutoRefresh()` to start/stop the auto-refresh background job.

There are also some new/changed methods to work with token refreshing:

```js
cognito.session.refresh();
cognito.session.refreshIfNeeded();
cognito.session.secondsUntilExpires();
cognito.session.needsRefresh();
cognito.session.needsRefreshSoon();
```
