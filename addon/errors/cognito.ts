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

  constructor(error: string | AmazonCognitoIdentityJsError, message?: string) {
    if (typeof error === 'string') {
      message = error;
      error = { message, name: 'CognitoError' };
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
  userAttributes: Object;
  requiredAttributes: Object;

  constructor(userAttributes: Object, requiredAttributes: Object) {
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

export class InvalidPasswordError extends CognitoError {
  constructor(error: AmazonCognitoIdentityJsError) {
    super(error);
    this.name = 'InvalidPasswordError';
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
    ExpiredCodeException: VerificationCodeMismatchError,
  };

  if (!error || typeof error !== 'object') {
    return error;
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

  return ErrorType ? new ErrorType(error) : new CognitoError(error);
}
