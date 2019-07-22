import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click, focus } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

module('Integration | Component | cognito-password-input', function(hooks) {
  setupRenderingTest(hooks);

  test('it allows to toggle visibility', async function(assert) {
    this.onChange = (val) => {
      set(this, 'value', val);
    };

    await render(
      hbs`<CognitoPasswordInput @onChange={{fn onChange}} @value={{value}} />`
    );

    assert.dom('input').hasAttribute('type', 'password');
    assert.dom('input').hasValue('');

    await fillIn('input', 'new-pass');
    await focus('input');
    await click('[data-test-cognito-password-toggle-visibility]');

    assert.equal(this.value, 'new-pass', 'value is correct');
    assert.dom('input').hasAttribute('type', 'text');
    assert.dom('input').hasValue('new-pass');
    assert.dom('input').isFocused();

    await fillIn('input', 'new-pass-2');
    await focus('input');
    await click('[data-test-cognito-password-toggle-visibility]');

    assert.equal(this.value, 'new-pass-2', 'value is correct');
    assert.dom('input').hasAttribute('type', 'password');
    assert.dom('input').hasValue('new-pass-2');
    assert.dom('input').isFocused();
  });

  test('it allows to toggle visibility', async function(assert) {
    this.onChange = () => {
      // noop
    };

    await render(
      hbs`<CognitoPasswordInput @onChange={{fn onChange}} @id="my-test-id"/>`
    );

    assert.dom('input').hasAttribute('type', 'password');
    assert.dom('input').hasValue('');
    assert.dom('input').hasAttribute('id', 'my-test-id');
  });
});
