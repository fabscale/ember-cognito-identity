import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import CognitoService from 'ember-cognito-identity/services/cognito';
import RouterService from '@ember/routing/router-service';

export default class IndexController extends Controller {
  @service declare cognito: CognitoService;
  @service declare router: RouterService;

  get jwtToken(): string | undefined {
    return this.cognito.session?.jwtToken;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(owner: any) {
    super(owner);

    // @ts-ignore
    window.cognito = this.cognito;
  }

  @action
  logout(): void {
    this.cognito.logout();
    this.router.transitionTo('login');
  }
}
