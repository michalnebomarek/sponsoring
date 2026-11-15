import { href } from '../router';
import { toast } from '../toast';
import { IconBack } from '../components/Icons';

export function appUrl(): string {
  return `${location.origin}${import.meta.env.BASE_URL}?dnes`;
}

export function Reminder() {
  const url = appUrl();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Odkaz je ve schránce.');
    } catch {
      toast('Kopírování se nepovedlo. Podrž odkaz a zkopíruj ho ručně.');
    }
  };
  return (
    <div class="screen reminder">
      <header class="navbar">
        <a class="icon-btn" href={href({ name: 'settings' })} aria-label="Zpět do nastavení">
          <IconBack />
        </a>
        <span class="eyebrow">Nastavení</span>
        <span class="navbar-end" />
      </header>
      <h1 class="week-title">Ranní připomínka</h1>
      <div class="prose">
        <p>
          Webová aplikace si sama připomínku naplánovat neumí. Zvládne to ale aplikace Zkratky, která je
          v iPhonu od začátku. Nastavení zabere asi dvě minuty.
        </p>
        <ol class="steps">
          <li>
            Otevři <strong>Zkratky</strong> a dole klepni na <strong>Automatizace</strong>.
          </li>
          <li>
            Klepni na <strong>+</strong> (Nová automatizace) a vyber <strong>Denní doba</strong>.
          </li>
          <li>
            Nastav čas, třeba <strong>7:00</strong>. U „Opakovat“ zvol <strong>Týdně</strong> a vyber pondělí až
            pátek. Zaškrtni <strong>Spustit okamžitě</strong> a klepni na Další.
          </li>
          <li>
            Zvol <strong>Nová prázdná automatizace</strong>, přidej akci <strong>Zobrazit oznámení</strong> a
            napiš do ní třeba „Dnešní lekce čeká.“
          </li>
          <li>
            Chceš-li, přidej ještě akci <strong>Otevřít URL</strong> a vlož do ní odkaz níže. Otevře rovnou
            dnešní lekci.
          </li>
        </ol>
      </div>

      <div class="url-box">
        <code class="url">{url}</code>
        <button class="btn btn--primary" onClick={copy}>
          Kopírovat odkaz
        </button>
      </div>

      <div class="prose">
        <p class="muted small">
          Pozor: iOS otevírá odkazy ze Zkratek v Safari, ne v aplikaci na ploše. Safari má vlastní data, takže
          tam neuvidíš svůj postup ani poznámky. Spolehlivější je nechat si jen oznámení a pak klepnout na
          ikonu Etapy.
        </p>
      </div>
    </div>
  );
}
