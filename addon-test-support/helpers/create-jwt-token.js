import { assign } from '@ember/polyfills';

export function createJWTToken(payload) {
  let header = {
    alg: 'RS256',
  };

  let data = assign(
    {
      exp: Math.round(new Date() / 1000) + 3600,
      iat: Math.round(new Date() / 1000),
    },
    payload
  );

  let encodedHeader = base64url(header);
  let encodedData = base64url(data);

  return `${encodedHeader}.${encodedData}`;
}

function base64url(source) {
  // Encode in classical base64
  let encodedSource = btoa(JSON.stringify(source));

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}
