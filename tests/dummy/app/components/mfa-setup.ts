import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import CognitoService from 'ember-cognito-identity/services/cognito';
import { CognitoUserMfa } from 'ember-cognito-identity/utils/cognito-mfa';

type Args = any;

export default class MfaSetup extends Component<Args> {
  @service declare cognito: CognitoService;

  @tracked secret?: string;
  @tracked isMfaEnabled = false;
  @tracked mfaCode?: string;
  @tracked error?: string;

  get mfa(): CognitoUserMfa {
    return this.cognito.cognitoData!.mfa;
  }

  get qrCodeData():
    | { secret: string; user: string; label: string }
    | undefined {
    let { cognitoData } = this.cognito;
    let { secret } = this;

    if (!secret || !cognitoData) {
      return undefined;
    }

    return {
      secret,
      user: cognitoData.cognitoUser.getUsername(),
      label: 'Fabscale',
    };
  }

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this._checkMfaEnabled();
  }

  async _checkMfaEnabled(): Promise<void> {
    try {
      this.isMfaEnabled = await this.mfa.isEnabled();
    } catch (error) {
      // ignore
    }
  }

  @action
  async setupMfa(): Promise<void> {
    this.secret = await this.mfa.setupDevice();
  }

  @action
  async disableMfa(): Promise<void> {
    await this.mfa.disable();

    this._checkMfaEnabled();
  }

  @action
  updateMfaCode(mfaCode: string): void {
    this.mfaCode = mfaCode;
  }

  @action
  async confirmMfa(): Promise<void> {
    let { mfaCode } = this;

    if (!mfaCode) {
      return;
    }

    this.error = undefined;

    try {
      await this.mfa.verifyDevice(mfaCode);
      await this.mfa.enable();
    } catch (error) {
      this.error = (error as any).message;
      return;
    }

    this._checkMfaEnabled();
    this.secret = undefined;
    this.mfaCode = undefined;
  }
}
