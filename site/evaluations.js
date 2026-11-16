const cards = [...document.querySelectorAll('.rating-card')];
const filter = document.querySelector('#evaluation-filter');
const count = document.querySelector('#evaluation-count');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let observer;
function playSequence(visible) {
  cards.forEach(card => card.classList.remove('enter'));
  if (reducedMotion.matches) return;
  // Restart the sequence as one wave, then leave every rating visible.
  void document.querySelector('.rating-grid').offsetWidth;
  visible.forEach((card, index) => {
    card.style.setProperty('--delay', `${index * 120}ms`);
    card.classList.add('enter');
  });
}
function showRatings(playNow = false) {
  observer?.disconnect();
  const visible = cards.filter(card => {
    card.hidden = filter.value !== 'all' && card.dataset.client !== filter.value;
    return !card.hidden;
  });
  count.textContent = filter.value === 'all'
    ? 'Showing all 24 category ratings'
    : 'Showing four category ratings for this evaluation';
  cards.forEach(card => card.classList.remove('enter'));
  if (playNow || reducedMotion.matches) {
    playSequence(visible);
    return;
  }
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    playSequence(visible);
  }, {threshold: 0});
  observer.observe(document.querySelector('.rating-grid'));
}
filter.addEventListener('change', () => showRatings(true));
reducedMotion.addEventListener('change', () => {
  showRatings(true);
});
showRatings();
