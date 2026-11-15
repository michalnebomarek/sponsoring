import { useMemo, useState } from 'preact/hooks';
import { glossary, lessonById, plain } from '../course';
import { href } from '../router';
import { IconSearch } from '../components/Icons';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function Glossary() {
  const [q, setQ] = useState('');
  const items = useMemo(
    () => glossary.map((t) => ({ t, hay: fold(`${t.term} ${plain(t.html)}`), key: fold(t.term) })),
    [],
  );
  const needle = fold(q.trim());
  const shown = needle
    ? items
        .filter((i) => i.hay.includes(needle))
        .sort((a, b) => Number(!a.key.includes(needle)) - Number(!b.key.includes(needle)))
    : items;

  let lastLetter = '';
  return (
    <div class="screen glossary">
      <header class="page-head">
        <h1>Slovníček</h1>
        <p class="lede">Všechny pojmy z lekcí, abecedně.</p>
      </header>
      <label class="search">
        <IconSearch size={20} />
        <span class="sr-only">Hledat pojem</span>
        <input
          type="search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="Hledat pojem"
          autocomplete="off"
          autocorrect="off"
          enterkeyhint="search"
        />
      </label>

      {!glossary.length && <p class="empty">Zatím tu nic není. Pojmy přibudou s lekcemi.</p>}
      {glossary.length > 0 && !shown.length && <p class="empty">Nic takového ve slovníčku není.</p>}

      <dl class="glossary-list">
        {shown.map(({ t }) => {
          const l = lessonById.get(t.lessonId)!;
          const letter = needle ? '' : t.term.charAt(0).toLocaleUpperCase('cs');
          const showLetter = letter && letter !== lastLetter;
          lastLetter = letter || lastLetter;
          return (
            <div key={`${t.lessonId}-${t.term}`}>
              {showLetter && (
                <p class="letter" aria-hidden="true">
                  {letter}
                </p>
              )}
              <div class="gl-item">
                <dt>{t.term}</dt>
                <dd>
                  <span dangerouslySetInnerHTML={{ __html: t.html }} />
                  <a class="gl-link" href={href({ name: 'lesson', id: l.id, anchor: 'pojmy' })}>
                    Etapa {l.week} · Lekce {l.n}
                  </a>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
