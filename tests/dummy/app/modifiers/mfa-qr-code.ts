// @ts-ignore
import { modifier } from 'ember-modifier';
import { assert } from '@ember/debug';
import { generateMfaQrCodeUrl } from 'ember-cognito-identity/utils/mfa-qr-code';
// @ts-ignore
import QRCode from 'qrcode';

interface MfaData {
  user: string;
  label: string;
  secret: string;
}

export default modifier((element: HTMLElement, [data]: [MfaData]) => {
  assert(
    '{{qr-code}} modifier can only be used on <canvas> elements!',
    element.tagName === 'CANVAS'
  );

  let url = generateMfaQrCodeUrl({
    user: data.user,
    label: data.label,
    secret: data.secret,
  });

  QRCode.toCanvas(element, url, function (error: Error | undefined) {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
  });
});
