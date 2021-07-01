import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import CognitoService from 'ember-cognito-identity/services/cognito';

export default class MfaSetup extends Component {
  @service cognito: CognitoService;

  @tracked secret?: string;
  @tracked isMfaEnabled = false;
  @tracked mfaCode?: string;
  @tracked error?: string;

  get mfa() {
    return this.cognito.cognitoData!.mfa;
  }

  get qrCodeData() {
    let { cognitoData } = this.cognito;
    let { secret } = this;

    return {
      secret,
      user: cognitoData?.cognitoUser.getUsername(),
      label: 'Fabscale',
    };
  }

  constructor(owner: unknown, args: any) {
    super(owner, args);

    this._checkMfaEnabled();
  }

  async _checkMfaEnabled() {
    try {
      this.isMfaEnabled = await this.mfa.isEnabled();
    } catch (error) {
      // ignore
    }
  }

  @action
  async setupMfa() {
    this.secret = await this.mfa.setupDevice();
  }

  @action
  async disableMfa() {
    await this.mfa.disable();

    this._checkMfaEnabled();
  }

  @action
  updateMfaCode(mfaCode: string) {
    this.mfaCode = mfaCode;
  }

  @action
  async confirmMfa() {
    let { mfaCode } = this;

    if (!mfaCode) {
      return;
    }

    this.error = undefined;

    try {
      await this.mfa.verifyDevice(mfaCode);
      await this.mfa.enable();
    } catch (error) {
      this.error = error.message;
      return;
    }

    this._checkMfaEnabled();
    this.secret = undefined;
    this.mfaCode = undefined;
  }
}
