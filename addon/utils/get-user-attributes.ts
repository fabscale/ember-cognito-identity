import { CognitoUser } from 'amazon-cognito-identity-js';
import { getUserData } from './cognito/get-user-data';

export async function getUserAttributes(
  cognitoUser: CognitoUser
): Promise<{ [index: string]: string }> {
  let userData = await getUserData(cognitoUser);

  let userAttributes: { [index: string]: string } = {};
  userData.UserAttributes.forEach((cognitoUserAttribute) => {
    let name = cognitoUserAttribute.Name;
    let value = cognitoUserAttribute.Value;

    userAttributes[name] = value;
  });

  return userAttributes;
}
