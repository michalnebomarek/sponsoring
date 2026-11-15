/**
 * Otevírání externích odkazů.
 *
 * - V HTML mají odkazy vždy původní https adresu, target="_blank" a
 *   rel="noopener noreferrer". Dlouhé podržení tak nabídne běžné menu iOS.
 * - Na iPhonu (a se zapnutým přepínačem) se klepnutí přepíše na
 *   googlechromes://… a otevře se v Chromu.
 * - Pojistka: když se do 1,5 s stránka neschová (Chrome se neotevřel),
 *   ukáže se upozornění s odkazem „Otevřít v prohlížeči“ (běžné _blank).
 *   Automaticky ho otevřít nejde – iOS po uplynutí času nepovolí nové okno
 *   bez klepnutí.
 */
import { getState } from './store';
import { toast } from './toast';

export const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function chromeUrl(href: string): string {
  return href.replace(/^https:\/\//i, 'googlechromes://').replace(/^http:\/\//i, 'googlechrome://');
}

/** Volá se těsně před odchodem ze stránky – aplikace si uloží pozici. */
let beforeLeave: () => void = () => {};
export function onBeforeLeave(fn: () => void) {
  beforeLeave = fn;
}

function openInChrome(href: string) {
  let left = false;
  const mark = () => {
    if (document.visibilityState === 'hidden') left = true;
  };
  const markBlur = () => (left = true);
  document.addEventListener('visibilitychange', mark);
  window.addEventListener('pagehide', markBlur);
  window.addEventListener('blur', markBlur);
  window.location.href = chromeUrl(href);
  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', mark);
    window.removeEventListener('pagehide', markBlur);
    window.removeEventListener('blur', markBlur);
    if (!left && document.visibilityState === 'visible') {
      toast('Chrome se neotevřel.', { href, label: 'Otevřít v prohlížeči' }, 6000);
    }
  }, 1500);
}

export function installLinkHandler() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a) return;
    const href = a.getAttribute('href') ?? '';
    if (!/^https?:\/\//i.test(href)) return;
    // odkaz z upozornění „Otevřít v prohlížeči“ jde vždy normální cestou
    if (a.hasAttribute('data-plain')) {
      beforeLeave();
      return;
    }

    if (!navigator.onLine) {
      e.preventDefault();
      toast('Zdroj se otevře, až budeš online.');
      return;
    }
    beforeLeave();
    if (getState().settings.chrome && isIOS()) {
      e.preventDefault();
      openInChrome(href);
    }
    // jinak necháme prohlížeč otevřít odkaz sám (target="_blank")
  });
}
