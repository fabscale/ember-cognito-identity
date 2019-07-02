import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['verificationCode', 'username'],

  verificationCode: null,
  username: null
});
