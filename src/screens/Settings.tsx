import { useRef } from 'preact/hooks';
import { exportBackup, importBackup, setChrome, useStore, localDay } from '../store';
import { href } from '../router';
import { toast } from '../toast';
import { IconBack, IconChevron } from '../components/Icons';

async function backup() {
  const json = exportBackup();
  const name = `etapa-zaloha-${localDay(new Date())}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Záloha Etapy' });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
    }
  }
  // záložní cesta: stažení souboru
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Záloha je uložená.');
}

export function Settings() {
  const s = useStore();
  const input = useRef<HTMLInputElement>(null);

  const restore = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    if (!window.confirm('Obnovit ze zálohy? Současný postup a poznámky se nahradí obsahem zálohy.')) return;
    const r = importBackup(text);
    toast(r.ok ? 'Hotovo. Postup a poznámky jsou obnovené.' : r.error);
    if (input.current) input.current.value = '';
  };

  return (
    <div class="screen settings">
      <header class="navbar">
        <a class="icon-btn" href={href({ name: 'today' })} aria-label="Zpět">
          <IconBack />
        </a>
        <span class="eyebrow">Nastavení</span>
        <span class="navbar-end" />
      </header>
      <h1 class="week-title">Nastavení</h1>

      <section class="group">
        <label class="row row--toggle">
          <span class="row-body">
            <span class="row-title">Otevírat zdroje v Chromu</span>
            <span class="row-note">
              Když je vypnuté, nebo se Chrome neotevře, odkaz se otevře v běžném prohlížeči.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            class="switch"
            checked={s.settings.chrome}
            onChange={(e) => setChrome((e.target as HTMLInputElement).checked)}
          />
        </label>
        <a class="row" href={href({ name: 'reminder' })}>
          <span class="row-body">
            <span class="row-title">Ranní připomínka</span>
            <span class="row-note">Jak si ji nastavit v aplikaci Zkratky.</span>
          </span>
          <IconChevron size={20} />
        </a>
      </section>

      <section class="group">
        <h2 class="group-title">Data</h2>
        <p class="row-note group-note">
          Postup a poznámky jsou jen v tomhle telefonu. Aplikace na ploše má jiná data než Safari, a když ji
          smažeš, data zmizí. Proto občas zazálohuj.
        </p>
        <button class="row" onClick={backup}>
          <span class="row-body">
            <span class="row-title">Zálohovat</span>
            <span class="row-note">Uloží soubor JSON, třeba do Souborů nebo na iCloud.</span>
          </span>
        </button>
        <button class="row" onClick={() => input.current?.click()}>
          <span class="row-body">
            <span class="row-title">Obnovit ze zálohy</span>
            <span class="row-note">Vyber dříve uložený soubor.</span>
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          class="sr-only"
          tabIndex={-1}
          onChange={(e) => restore((e.target as HTMLInputElement).files?.[0])}
        />
      </section>

      <p class="muted small colophon">Etapa · verze {__BUILD_DATE__}</p>
    </div>
  );
}
