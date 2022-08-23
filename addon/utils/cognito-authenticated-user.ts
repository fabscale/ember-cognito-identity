import {
  CognitoUser,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';
import { CognitoUserMfa } from './cognito-mfa';
import { updatePassword } from './cognito/update-password';
import { updateUserAttributes } from './cognito/update-user-attributes';
import { getUserAttributes } from './get-user-attributes';

export type UserAttributes = { [key: string]: any };

export class CognitoAuthenticatedUser {
  cognitoUser: CognitoUser;
  userAttributes: UserAttributes;
  mfa: CognitoUserMfa;

  constructor(cognitoUser: CognitoUser, userAttributes: UserAttributes) {
    this.cognitoUser = cognitoUser;
    this.userAttributes = userAttributes;
    this.mfa = new CognitoUserMfa(cognitoUser);
  }

  updatePassword({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    let { cognitoUser } = this;

    return updatePassword(cognitoUser, { oldPassword, newPassword });
  }

  async updateAttributes(attributes: {
    [index: string]: string;
  }): Promise<UserAttributes> {
    let { cognitoUser } = this;

    let attributeList: ICognitoUserAttributeData[] = Object.keys(
      attributes
    ).map((attributeName) => {
      return {
        Name: attributeName,
        Value: attributes[attributeName]!,
      };
    });

    await updateUserAttributes(cognitoUser, attributeList);

    let userAttributes = await getUserAttributes(cognitoUser);

    this.userAttributes = userAttributes;

    return userAttributes;
  }
}
