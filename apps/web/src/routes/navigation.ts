/**
 * Programmatic SPA Navigation Helper for Nebula Frontend.
 */

export function navigateTo(url: string, replace = false): void {
  if (typeof window === 'undefined') return;

  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
