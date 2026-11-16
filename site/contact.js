const form = document.querySelector('#contact-form');
const submit = form.querySelector('button[type="submit"]');
const status = document.querySelector('#contact-form-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled || !form.reportValidity()) return;
  const fields = new FormData(form);
  fields.set('name', `${fields.get('first_name')} ${fields.get('last_name')}`.trim());
  fields.set('subject', `3N website inquiry: ${fields.get('service')}`);
  submit.disabled = true;
  submit.textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  status.hidden = true;
  status.classList.remove('is-error');
  try {
    const response = await fetch(form.action, {
      method: 'POST', body: fields, headers: {Accept: 'application/json'},
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error('Submission was not accepted');
    status.textContent = 'Thank you. Your inquiry has been submitted to 3N Consulting.';
    form.reset();
  } catch {
    status.classList.add('is-error');
    status.textContent = 'We couldn’t confirm your submission. Your details are still here. Please try again or email info@3nconsultinggroup.com.';
  } finally {
    status.hidden = false;
    submit.disabled = false;
    submit.textContent = 'Send inquiry';
    form.removeAttribute('aria-busy');
  }
});
