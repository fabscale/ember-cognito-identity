export class CognitoError extends Error {
  constructor(error, message) {
    if (typeof error === 'string') {
      message = error;
      error = {};
    }

    let humanMessage = message || error.message;

    super(humanMessage);

    this.message = humanMessage;
    this.errorMessage = error.message;
    this.name = error.name || 'CognitoError';
    this._error = error;
  }
}

export class NewPasswordRequiredError extends CognitoError {
  constructor(userAttributes, requiredAttributes) {
    super('A new password must be set.');

    this.name = 'NewPasswordRequiredError';
    this.userAttributes = userAttributes;
    this.requiredAttributes = requiredAttributes;
  }
}

export class InvalidAuthorizationError extends CognitoError {
  constructor(error) {
    super(error, 'The password you provided is incorrect.');
    this.name = 'InvalidAuthorizationError';
  }
}

export class UserNotFoundError extends CognitoError {
  constructor(error) {
    super(error, 'This user does not exist.');
    this.name = 'UserNotFoundError';
  }
}

export class PasswordResetRequiredError extends CognitoError {
  constructor(error) {
    super(error, 'Password reset required for the user.');
    this.name = 'PasswordResetRequiredError';
  }
}

export class VerificationCodeMismatchError extends CognitoError {
  constructor(error) {
    super(error, 'Invalid verification code provided, please try again.');
    this.name = 'VerificationCodeMismatchError';
  }
}

export class InvalidPasswordError extends CognitoError {
  constructor(error) {
    super(error);
    this.name = 'InvalidPasswordError';
  }
}

export function dispatchError(error) {
  let errorMap = {
    PasswordResetRequiredException: PasswordResetRequiredError,
    NotAuthorizedException: InvalidAuthorizationError,
    CodeMismatchException: VerificationCodeMismatchError,
    InvalidPasswordException: InvalidPasswordError,
    UserNotFoundException: UserNotFoundError,
    ExpiredCodeException: VerificationCodeMismatchError
  };

  if (!error || typeof error !== 'object') {
    return error;
  }

  let ErrorType = errorMap[error.code];

  // Special case: When updating attributes, this can be thrown, which is incorrectly assumed to be a password issue
  if (
    ErrorType === InvalidAuthorizationError &&
    error.message === 'A client attempted to write unauthorized attribute'
  ) {
    ErrorType = CognitoError;
  }

  return ErrorType ? new ErrorType(error) : new CognitoError(error);
}
