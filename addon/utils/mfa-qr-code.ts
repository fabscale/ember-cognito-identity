export function generateMfaQrCodeUrl({
  secret,
  user,
  label,
}: {
  secret: string;
  user: string;
  label: string;
}): string {
  return `otpauth://totp/${label}:${user}?secret=${secret}&issuer=${label}`;
}
