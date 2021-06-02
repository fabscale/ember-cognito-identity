export function setupPretenderResetPassword(context) {
  context.awsHooks['AWSCognitoIdentityProviderService.ForgotPassword'] = () => {
    return {
      CodeDeliveryDetails: {
        AttributeName: 'email',
        DeliveryMedium: 'EMAIL',
        Destination: 'j***@f***.com',
      },
    };
  };

  context.awsHooks['AWSCognitoIdentityProviderService.ConfirmForgotPassword'] =
    () => {
      return {};
    };
}
