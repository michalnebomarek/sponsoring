/**
 * Jednoduché směrování přes hash (#/lekce/t1-l3). Na GitHub Pages
 * to funguje bez nastavování serveru a i offline.
 */
import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'today' }
  | { name: 'trail' }
  | { name: 'week'; n: number }
  | { name: 'lesson'; id: string; anchor?: string }
  | { name: 'notes' }
  | { name: 'glossary' }
  | { name: 'settings' }
  | { name: 'reminder' };

export function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (p[0]) {
    case 'trasa':
      return { name: 'trail' };
    case 'tyden':
      return Number(p[1]) ? { name: 'week', n: Number(p[1]) } : { name: 'trail' };
    case 'lekce':
      return p[1] ? { name: 'lesson', id: p[1], anchor: p[2] } : { name: 'today' };
    case 'poznamky':
      return { name: 'notes' };
    case 'slovnicek':
      return { name: 'glossary' };
    case 'nastaveni':
      return { name: 'settings' };
    case 'pripominka':
      return { name: 'reminder' };
    default:
      return { name: 'today' };
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'today':
      return '#/';
    case 'trail':
      return '#/trasa';
    case 'week':
      return `#/tyden/${r.n}`;
    case 'lesson':
      return `#/lekce/${r.id}${r.anchor ? '/' + r.anchor : ''}`;
    case 'notes':
      return '#/poznamky';
    case 'glossary':
      return '#/slovnicek';
    case 'settings':
      return '#/nastaveni';
    case 'reminder':
      return '#/pripominka';
  }
}

export function navigate(r: Route | string, replace = false) {
  const h = typeof r === 'string' ? r : href(r);
  if (replace) {
    history.replaceState(null, '', h);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else location.hash = h;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Aktuální route; změnu obalí do View Transition, pokud to prohlížeč umí. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      const next = parse(location.hash);
      if (document.startViewTransition && !reducedMotion()) {
        document.startViewTransition(
          () =>
            new Promise<void>((res) => {
              setRoute(next);
              // Preact překresluje v mikroúloze; setTimeout počká, až je hotovo.
              // (requestAnimationFrame by tu nefungoval – během přechodu se nevykresluje.)
              setTimeout(res, 0);
            }),
        );
      } else setRoute(next);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
