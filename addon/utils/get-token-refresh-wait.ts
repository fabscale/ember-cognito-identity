import { CognitoUserSession } from 'amazon-cognito-identity-js';

// Taken from:
// https://github.com/aws-amplify/amplify-js/blob/08e01b1c09cfab73f2eb1b1b18fe1a696e2a028f/packages/amazon-cognito-identity-js/src/CognitoUserSession.js#L73
export function getSecondsUntilTokenExpires(
  cognitoUserSession: CognitoUserSession
): number {
  let now = Math.floor(+new Date() / 1000);
  // @ts-ignore
  let drift = cognitoUserSession.getClockDrift();
  let adjusted = now - drift;

  // Whichever is next
  let remaining = Math.min(
    cognitoUserSession.getAccessToken().getExpiration() - adjusted,
    cognitoUserSession.getIdToken().getExpiration() - adjusted
  );

  // Cannot be below 0
  return Math.max(remaining, 0);
}

// In ms
export function getTokenRefreshWait(
  cognitoUserSession: CognitoUserSession
): number {
  let remaining = getSecondsUntilTokenExpires(cognitoUserSession);

  // We want to refresh 15 minutes before the actual expiration date, to leave some wiggle room
  let offset = 15 * 60;

  return Math.max(0, remaining - offset) * 1000;
}
