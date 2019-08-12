import Controller from '@ember/controller';

export default class ResetPasswordController extends Controller {
  queryParams = ['verificationCode', 'username'];

  verificationCode = null;
  username = null;
}
