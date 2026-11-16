const spotlight = document.querySelector('.testimonial-spotlight');
if (spotlight) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const quotes = [...spotlight.querySelectorAll('.spotlight-quote')];
  const number = spotlight.querySelector('[data-rating-total]');
  const total = Number(number.dataset.ratingTotal);
  let active = 0;
  let timer;
  let visible = false;
  let counted = false;
  quotes.forEach(quote => {
    const words = quote.querySelector('blockquote').textContent.trim().split(/\s+/).length;
    quote.classList.toggle('is-long', words > 20);
  });
  function schedule() {
    clearTimeout(timer);
    if (!visible || document.hidden || reducedMotion.matches ||
        spotlight.contains(document.activeElement) || quotes.length < 2) return;
    const duration = 3500;
    timer = setTimeout(() => {
      quotes[active].classList.remove('is-active');
      quotes[active].setAttribute('aria-hidden', 'true');
      active = (active + 1) % quotes.length;
      quotes[active].classList.add('is-active');
      quotes[active].removeAttribute('aria-hidden');
      schedule();
    }, duration);
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !counted && !reducedMotion.matches) {
      counted = true;
      spotlight.classList.add('is-visible');
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / 850, 1);
        number.textContent = Math.round(total * (1 - (1 - progress) ** 3));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    schedule();
  }, {threshold: .2});
  observer.observe(spotlight);
  spotlight.addEventListener('focusin', schedule);
  spotlight.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
}
