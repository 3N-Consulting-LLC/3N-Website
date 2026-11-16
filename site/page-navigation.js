// Warm likely destinations without delaying or intercepting normal navigation.
(() => {
  const connection = navigator.connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  const warmed = new Set();
  const current = new URL(location.href);
  function warm(event) {
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, current);
    if (url.origin !== current.origin ||
        !url.pathname.endsWith('/') || url.pathname === current.pathname || url.search) return;
    url.hash = '';
    if (warmed.has(url.href) || warmed.size >= 6) return;
    warmed.add(url.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.as = 'document';
    hint.href = url.href;
    document.head.append(hint);
  }
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });
})();
