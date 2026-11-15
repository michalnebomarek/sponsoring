import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './fonts.css';
import './styles.css';
import { App, setPendingRestore } from './app';
import { getState, todayLesson } from './store';
import { href } from './router';
import { installLinkHandler } from './links';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// ——— kam aplikaci po startu otevřít ———
const params = new URLSearchParams(location.search);
if (params.has('dnes')) {
  // /?dnes → rovnou dnešní lekce
  const l = todayLesson();
  history.replaceState(null, '', `${location.pathname}${l ? href({ name: 'lesson', id: l.id }) : '#/'}`);
} else if (!location.hash || location.hash === '#/' || location.hash === '#') {
  // Aplikaci na ploše iOS spouští vždy od začátku. Když ji mezitím ukončil
  // (třeba když byl Michal v Chromu), vrátíme ho tam, kde skončil.
  const last = getState().last;
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  if (last && last.route && last.route !== '#/' && Date.now() - last.t < SIX_HOURS) {
    history.replaceState(null, '', `${location.pathname}${last.route}`);
    setPendingRestore({ route: last.route, y: last.y });
  }
}

installLinkHandler();
render(<App />, document.getElementById('app')!);

// Trvalé úložiště: požádá prohlížeč, ať data nemaže při nedostatku místa.
navigator.storage?.persist?.().catch(() => {});

// ——— service worker: offline a aktualizace ———
// Nová verze (třeba nový týden) se stáhne na pozadí a načte se při dalším otevření.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
      });
    },
  });
}
