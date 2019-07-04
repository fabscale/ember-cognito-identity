import { assign } from '@ember/polyfills';
import CryptoJS from 'crypto-js';

export function createJWTToken(payload) {
  let header = {
    alg: 'RS256'
  };

  let data = assign(
    {
      exp: Math.round(new Date() / 1000) + 3600,
      iat: Math.round(new Date() / 1000)
    },
    payload
  );

  let stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
  let encodedHeader = base64url(stringifiedHeader);

  let stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
  let encodedData = base64url(stringifiedData);

  return encodedHeader + '.' + encodedData;
}

function base64url(source) {
  // Encode in classical base64
  let encodedSource = CryptoJS.enc.Base64.stringify(source);

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}
