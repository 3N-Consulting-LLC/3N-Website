import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../site/contact.js', import.meta.url), 'utf8');
async function scenario({ok = true, valid = true, networkError = false} = {}) {
  let submitHandler, resets = 0, calls = 0;
  const values = new Map([['first_name', 'Test'], ['last_name', 'Visitor'], ['service', 'Enterprise Solutions']]);
  const button = {disabled: false, textContent: 'Send inquiry'};
  const classes = new Set();
  const status = {hidden: true, textContent: '', classList: {add: x => classes.add(x), remove: x => classes.delete(x)}};
  const form = {
    action: 'https://formspree.io/f/xeoykvke',
    querySelector: () => button, reportValidity: () => valid,
    addEventListener: (_, handler) => {submitHandler = handler;},
    setAttribute() {}, removeAttribute() {}, reset: () => {resets++;}
  };
  vm.runInNewContext(source, {
    document: {querySelector: selector => selector === '#contact-form' ? form : status},
    FormData: class {get(key) {return values.get(key);} set(key, value) {values.set(key, value);}},
    AbortSignal,
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, form.action);
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Accept, 'application/json');
      assert.equal(button.disabled, true);
      assert.equal(values.get('name'), 'Test Visitor');
      if (networkError) throw new Error('Simulated network error');
      return {ok};
    }
  });
  await submitHandler({preventDefault() {}});
  assert.equal(button.disabled, false);
  if (!valid) {assert.equal(calls, 0); assert.equal(resets, 0); return;}
  assert.equal(calls, 1);
  assert.equal(status.hidden, false);
  assert.equal(resets, ok && !networkError ? 1 : 0);
  assert.equal(classes.has('is-error'), !ok || networkError);
  assert.match(status.textContent, ok && !networkError ? /submitted/ : /couldn’t confirm/);
}
await scenario();
await scenario({ok: false});
await scenario({networkError: true});
await scenario({valid: false});
console.log('Contact form checks passed: invalid forms do not send, pending state prevents duplicate clicks, confirmed success resets, failures preserve input. All requests mocked.');
