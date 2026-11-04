/**
 * Applies the `printing-mode` CSS class to document.body which hides the sidebar,
 * header, input forms, and action buttons, leaving ONLY the A4 printable document container visible,
 * then triggers window.print().
 */
export function triggerPrintDocument() {
  document.body.classList.add('printing-mode');

  const cleanup = () => {
    document.body.classList.remove('printing-mode');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  setTimeout(() => {
    try {
      window.print();
    } finally {
      // Fallback cleanup in case afterprint does not fire in sandboxed environments
      setTimeout(cleanup, 1200);
    }
  }, 80);
}
