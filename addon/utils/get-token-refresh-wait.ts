import { CognitoUserSession } from 'amazon-cognito-identity-js';

export function getTokenRefreshWait(
  cognitoUserSession: CognitoUserSession
): number {
  let expirationTimestamp = cognitoUserSession.getAccessToken().getExpiration();
  let now = Math.floor(+new Date() / 1000);

  // We want to refresh 15 minutes before the actual expiration date, to leave some wiggle room
  let offset = 15 * 60;

  // Fall back to default of 45 mins, if timestamp is not available for whatever reason.
  return expirationTimestamp
    ? Math.max(0, expirationTimestamp - now - offset) * 1000
    : 60 * 45 * 1000;
}
