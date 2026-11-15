import { useLayoutEffect, useRef } from 'preact/hooks';
import { course } from './course';
import { ackWeeks, useStore, getState, saveLast, saveReadPos } from './store';
import { useRoute, href, navigate, type Route } from './router';
import { useToast } from './toast';
import { onBeforeLeave } from './links';
import { IconToday, IconTrail, IconNotes, IconGlossary } from './components/Icons';
import { Today } from './screens/Today';
import { Trail } from './screens/Trail';
import { WeekScreen } from './screens/Week';
import { LessonScreen } from './screens/Lesson';
import { Notes } from './screens/Notes';
import { Glossary } from './screens/Glossary';
import { Settings } from './screens/Settings';
import { Reminder } from './screens/Reminder';

const TABS = [
  { name: 'today', label: 'Dnes', to: '#/', Icon: IconToday },
  { name: 'trail', label: 'Trasa', to: '#/trasa', Icon: IconTrail },
  { name: 'notes', label: 'Poznámky', to: '#/poznamky', Icon: IconNotes },
  { name: 'glossary', label: 'Slovníček', to: '#/slovnicek', Icon: IconGlossary },
] as const;

function activeTab(r: Route): string {
  if (r.name === 'week' || r.name === 'lesson') return 'trail';
  if (r.name === 'settings' || r.name === 'reminder') return 'today';
  return r.name;
}

function TabBar({ route }: { route: Route }) {
  const active = activeTab(route);
  return (
    <nav class="tabbar" aria-label="Hlavní navigace">
      {TABS.map(({ name, label, to, Icon }) => (
        <a
          key={name}
          href={to}
          class={`tab${active === name ? ' tab--active' : ''}`}
          aria-current={active === name ? 'page' : undefined}
        >
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function ToastView() {
  const t = useToast();
  if (!t) return null;
  return (
    <div class="toast" role="status" key={t.id}>
      <span>{t.text}</span>
      {t.link && (
        <a href={t.link.href} target="_blank" rel="noopener noreferrer" data-plain class="toast-link">
          {t.link.label}
        </a>
      )}
    </div>
  );
}

function UpdateBanner() {
  const s = useStore();
  if (course.weeks.length <= s.knownWeeks) return null;
  const newest = course.weeks[course.weeks.length - 1];
  return (
    <div class="banner" role="status">
      <a
        class="banner-main"
        href={href({ name: 'week', n: newest.n })}
        onClick={() => ackWeeks()}
      >
        Přibyl nový týden: {newest.title}
      </a>
      <button class="banner-close" onClick={() => ackWeeks()} aria-label="Zavřít">
        ×
      </button>
    </div>
  );
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'today':
      return <Today />;
    case 'trail':
      return <Trail />;
    case 'week':
      return <WeekScreen n={route.n} />;
    case 'lesson':
      return <LessonScreen id={route.id} anchor={route.anchor} />;
    case 'notes':
      return <Notes />;
    case 'glossary':
      return <Glossary />;
    case 'settings':
      return <Settings />;
    case 'reminder':
      return <Reminder />;
  }
}

/** Pozice posunu pro obrazovky v rámci jednoho spuštění (lekce mají vlastní, trvalou). */
const memScroll = new Map<string, number>();

/** Pozice, na kterou se má aplikace vrátit po startu (nastaví main.tsx). */
export let pendingRestore: { route: string; y: number } | null = null;
export function setPendingRestore(v: typeof pendingRestore) {
  pendingRestore = v;
}

export function App() {
  const route = useRoute();
  const key = href(route);
  const prevKey = useRef<string | null>(null);

  // uložení pozice při odchodu ze stránky (do Chromu, přepnutí aplikace, ukončení)
  useLayoutEffect(() => {
    const save = () => {
      const k = location.hash || '#/';
      saveLast(k, window.scrollY);
      const r = route;
      if (r.name === 'lesson') saveReadPos(r.id, window.scrollY);
    };
    onBeforeLeave(save);
    const onVis = () => document.visibilityState === 'hidden' && save();
    let t: number | undefined;
    const onScroll = () => {
      clearTimeout(t);
      t = window.setTimeout(save, 400);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', save);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, [key]);

  // obnova pozice při změně obrazovky
  useLayoutEffect(() => {
    if (prevKey.current) memScroll.set(prevKey.current, window.scrollY);
    prevKey.current = key;
    let y = 0;
    if (pendingRestore && pendingRestore.route === key) {
      y = pendingRestore.y;
      pendingRestore = null;
    } else if (route.name === 'lesson') {
      if (route.anchor) {
        y = -1; // řeší LessonScreen (skok na pojmy)
      } else {
        y = getState().readPos[route.id] ?? 0;
      }
    } else {
      y = memScroll.get(key) ?? 0;
    }
    if (y >= 0) {
      window.scrollTo(0, y);
      // obsah může dorůst (písma) – zkusit ještě jednou po vykreslení
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [key]);

  const showTabs = route.name !== 'lesson';
  return (
    <>
      <UpdateBanner />
      <main class={`app${showTabs ? ' app--tabs' : ''}`} key={key}>
        <Screen route={route} />
      </main>
      {showTabs && <TabBar route={route} />}
      <ToastView />
    </>
  );
}

export { navigate };
