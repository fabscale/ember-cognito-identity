import {
  CognitoError,
  InvalidAuthorizationError,
  UserNotFoundError,
  PasswordResetRequiredError,
  VerificationCodeMismatchError,
  VerificationCodeExpiredError,
  InvalidPasswordError,
  PasswordCannotBeResetError,
  dispatchError,
} from 'ember-cognito-identity/errors/cognito';
import { module, test } from 'qunit';

module('Unit | Utility | errors/cognito', function () {
  test('it works for a string', function (assert) {
    // @ts-ignore
    let result = dispatchError('test error');
    assert.ok(result instanceof CognitoError);
    assert.strictEqual(result.message, 'test error');
  });

  test('it works with null', function (assert) {
    // @ts-ignore
    let result = dispatchError(null);
    assert.ok(result instanceof CognitoError);
    assert.strictEqual(result.message, 'An error has occurred.');
  });

  test('it works for PasswordResetRequiredException', function (assert) {
    let result = dispatchError({
      code: 'PasswordResetRequiredException',
      name: 'PasswordResetRequiredException',
      message: 'test message',
    });

    assert.ok(result instanceof PasswordResetRequiredError);
    assert.strictEqual(result.message, 'Password reset required for the user.');
  });

  test('it works for NotAuthorizedException', function (assert) {
    let result = dispatchError({
      code: 'NotAuthorizedException',
      name: 'NotAuthorizedException',
      message: 'test message',
    });

    assert.ok(result instanceof InvalidAuthorizationError);
    assert.strictEqual(
      result.message,
      'The password you provided is incorrect.'
    );
  });

  test('it works for CodeMismatchException', function (assert) {
    let result = dispatchError({
      code: 'CodeMismatchException',
      name: 'CodeMismatchException',
      message: 'test message',
    });

    assert.ok(result instanceof VerificationCodeMismatchError);
    assert.strictEqual(
      result.message,
      'Invalid verification code provided, please try again.'
    );
  });

  test('it works for InvalidPasswordException', function (assert) {
    let result = dispatchError({
      code: 'InvalidPasswordException',
      name: 'InvalidPasswordException',
      message: 'test message',
    });

    assert.ok(result instanceof InvalidPasswordError);
    assert.strictEqual(result.message, 'test message');
  });

  test('it works for InvalidParameterException', function (assert) {
    let result = dispatchError({
      code: 'InvalidParameterException',
      name: 'InvalidParameterException',
      message: 'test message',
    });

    assert.ok(result instanceof InvalidPasswordError);
    assert.strictEqual(result.message, 'test message');
  });

  test('it works for UserNotFoundException', function (assert) {
    let result = dispatchError({
      code: 'UserNotFoundException',
      name: 'UserNotFoundException',
      message: 'test message',
    });

    assert.ok(result instanceof UserNotFoundError);
    assert.strictEqual(result.message, 'This user does not exist.');
  });

  test('it works for ExpiredCodeException', function (assert) {
    let result = dispatchError({
      code: 'ExpiredCodeException',
      name: 'ExpiredCodeException',
      message: 'test message',
    });

    assert.ok(result instanceof VerificationCodeExpiredError);
    assert.strictEqual(
      result.message,
      'The verification code is expired, please request a new one.'
    );
  });

  module('special cases', function () {
    test('it handles updating invalid attributes', function (assert) {
      let result = dispatchError({
        name: 'NotAuthorizedException',
        code: 'NotAuthorizedException',
        message: 'A client attempted to write unauthorized attribute',
      });

      assert.ok(result instanceof CognitoError);
      assert.strictEqual(
        result.message,
        'A client attempted to write unauthorized attribute'
      );
    });

    test('it handles requesting a password reset for an inactive user', function (assert) {
      let result = dispatchError({
        name: 'NotAuthorizedException',
        code: 'NotAuthorizedException',
        message: 'User password cannot be reset in the current state.',
      });

      assert.ok(result instanceof PasswordCannotBeResetError);
      assert.strictEqual(
        result.message,
        'The user you are trying to reset the password for is not active.'
      );
    });
  });
});
