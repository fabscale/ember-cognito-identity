export function initialize(): void {
  // Some dependencies of amazon-cognito-identity-js (wrongly) rely on `global` to exist
  // So we do a very naive "fix" here to make that work
  if (typeof window.global === 'undefined') {
    // @ts-ignore
    window.global = window;
  }
}

export default {
  initialize
};
