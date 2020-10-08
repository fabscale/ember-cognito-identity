import { UserAttributes } from "ember-cognito-identity/services/cognito";

export interface AmazonCognitoIdentityJsError {
  message: string;
  name: string;
  code?: string;
}

export class CognitoError extends Error {
  message: string;
  errorMessage: string;
  name: string;
  _error: AmazonCognitoIdentityJsError;

  constructor(
    error: string | AmazonCognitoIdentityJsError | null,
    message?: string
  ) {
    if (typeof error === 'string') {
      message = error;
      error = { message, name: 'CognitoError' };
    }

    if (!error || typeof error !== 'object') {
      error = { message: 'An error has occurred.', name: 'CognitoError' };
    }

    let humanMessage = message || error.message || 'An error has occurred.';

    super(humanMessage);

    this.message = humanMessage;
    this.errorMessage = error.message;
    this.name = error.name || 'CognitoError';
    this._error = error;
  }
}

// Note: This error is never thrown by dispatchError, but only manually in cognito._authenticate()
export class NewPasswordRequiredError extends CognitoError {
  userAttributes: UserAttributes;
  requiredAttributes: UserAttributes;

  constructor(userAttributes: UserAttributes, requiredAttributes: UserAttributes) {
    super('A new password must be set.');

    this.name = 'NewPasswordRequiredError';
    this.userAttributes = userAttributes;
    this.requiredAttributes = requiredAttributes;
  }
}

export class InvalidAuthorizationError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error, 'The password you provided is incorrect.');
    this.name = 'InvalidAuthorizationError';
  }
}

export class UserNotFoundError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error, 'This user does not exist.');
    this.name = 'UserNotFoundError';
  }
}

export class PasswordResetRequiredError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error, 'Password reset required for the user.');
    this.name = 'PasswordResetRequiredError';
  }
}

export class VerificationCodeMismatchError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error, 'Invalid verification code provided, please try again.');
    this.name = 'VerificationCodeMismatchError';
  }
}

export class VerificationCodeExpiredError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error, 'The verification code is expired, please request a new one.');
    this.name = 'VerificationCodeExpiredError';
  }
}

export class InvalidPasswordError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error);
    this.name = 'InvalidPasswordError';
  }
}

export class PasswordCannotBeResetError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(
      error,
      'The user you are trying to reset the password for is not active.'
    );
    this.name = 'PasswordCannotBeResetError';
  }
}

export function dispatchError(error: AmazonCognitoIdentityJsError) {
  let errorMap = {
    PasswordResetRequiredException: PasswordResetRequiredError,
    NotAuthorizedException: InvalidAuthorizationError,
    CodeMismatchException: VerificationCodeMismatchError,
    InvalidPasswordException: InvalidPasswordError,
    InvalidParameterException: InvalidPasswordError,
    UserNotFoundException: UserNotFoundError,
    ExpiredCodeException: VerificationCodeExpiredError,
  };

  if (!error || typeof error !== 'object') {
    return new CognitoError(error);
  }

  // @ts-ignore
  let ErrorType = errorMap[error.code];

  // Special case: When updating attributes, this can be thrown, which is incorrectly assumed to be a password issue
  if (
    ErrorType === InvalidAuthorizationError &&
    error.message === 'A client attempted to write unauthorized attribute'
  ) {
    ErrorType = CognitoError;
  }

  // Special case: When requesting password reset, this can be thrown
  if (
    ErrorType === InvalidAuthorizationError &&
    error.message === 'User password cannot be reset in the current state.'
  ) {
    ErrorType = PasswordCannotBeResetError;
  }

  return ErrorType ? new ErrorType(error) : new CognitoError(error);
}
