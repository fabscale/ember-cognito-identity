import Error from '@ember/error';

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
    super(error, 'Invalid username or password provided.');
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
    UserNotFoundException: UserNotFoundError
  };

  let ErrorType = errorMap[error.code];
  return ErrorType ? new ErrorType(error) : new CognitoError(error);
}
