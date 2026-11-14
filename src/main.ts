import './style.css';
import { encode, decode } from './codec';

type Direction = 'encode' | 'decode';
let direction: Direction = 'encode';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="page-shell">
    <header class="topbar"><a class="brand" href="#top" aria-label="Awasobaba Startseite"><span class="brand-icon" aria-hidden="true">✳</span> awasobaba<span class="brand-dot">.</span></a></header>
    <main id="top">
      <section class="hero" aria-labelledby="title">
        <div class="hero-copy"><h1 id="title">Worte rein.<br><em>Awasobaba</em> raus<span class="hero-dot">.</span></h1></div>
        <div class="hero-art" aria-hidden="true"><div class="art-spark spark-one">✳</div><div class="art-spark spark-two">✦</div><img class="hero-illustration" src="/backerin.png" alt=""></div>
      </section>
      <section class="translator" aria-label="Awasobaba-Übersetzer">
        
        <div class="direction-tabs" role="group" aria-label="Richtung wählen"><button class="direction active" data-direction="encode" aria-pressed="true">Text <span>→</span> Awasobaba</button><button class="direction" data-direction="decode" aria-pressed="false">Awasobaba <span>→</span> Text</button></div>
        <div class="fields"><div class="field"><div class="field-heading"><label id="input-label" for="input">DEIN TEXT</label><span id="input-count">0 Zeichen</span></div><textarea id="input" spellcheck="false" placeholder="Hier kommen deine Worte rein …"></textarea><div class="field-bottom"><span></span><button id="example" class="text-button" type="button">Beispiel laden <span>↗</span></button></div></div>
        <button id="swap" class="swap" type="button" aria-label="Richtung wechseln" title="Richtung wechseln">⇄</button>
        <div class="field output-field"><div class="field-heading"><label id="output-label" for="output">AWASOBABA</label><span id="output-count">0 Zeichen</span></div><textarea id="output" readonly placeholder="AWASOBABA"></textarea><div class="field-bottom"><span></span><span class="tiny-star">✳</span></div></div></div>
        <div id="error" class="error" role="alert" hidden></div>
        <div class="actions"><div class="action-left"><button id="copy" class="button primary" type="button">Kopieren <span>↗</span></button><button id="clear" class="button secondary" type="button">Leeren</button><button id="swap-text" class="mobile-swap" type="button">⇄ &nbsp; Richtung wechseln</button></div><span id="copy-status" class="copy-status" role="status" aria-live="polite"></span><span class="privacy"><span>✳</span> Bleibt alles in deinem Browser.</span></div>
      </section>
      <section class="bottom-row"><details><summary><span><span class="summary-icon">?</span> Wie funktioniert’s?</span><span class="plus" aria-hidden="true">+</span></summary><div class="details-content"><p>Dein Text wird in UTF-8-Bytes und dann in kleine Bitgruppen zerlegt. Jede Gruppe wird zu einem Block: erst 1 bis 4 mal <strong>awa</strong>, dann <strong>so</strong>, dann <strong>ba</strong>. Der Mehl-Marker verrät, wie viele Bits aufgefüllt wurden. So kommt beim Zurückübersetzen alles wieder heil heraus.</p></div></details><div class="baba-badge" aria-label="Mit extra Baba"><div class="bottom-stamp" aria-hidden="true"><img src="/baba.png" alt=""></div><span class="baba-badge-text" aria-hidden="true">MIT EXTRA<br><strong>BABA<span>.</span></strong></span></div></section>
    </main><footer><span>© AWASOBABA · MIT MEHL GEMACHT</span><span>WENIGER BLABLA, MEHR BABA. ✳</span></footer>
  </div>`;
const input = document.querySelector<HTMLTextAreaElement>('#input')!;
const output = document.querySelector<HTMLTextAreaElement>('#output')!;
const error = document.querySelector<HTMLDivElement>('#error')!;
const status = document.querySelector<HTMLSpanElement>('#copy-status')!;
const copy = document.querySelector<HTMLButtonElement>('#copy')!;
const count = (text: string) => `${Array.from(text).length} Zeichen`;
function update() {
  status.textContent = '';
  error.hidden = true;
  try { output.value = direction === 'encode' ? encode(input.value) : decode(input.value); }
  catch (err) { output.value = ''; error.textContent = err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen.'; error.hidden = false; }
  document.querySelector('#input-count')!.textContent = count(input.value);
  document.querySelector('#output-count')!.textContent = count(output.value);
  copy.disabled = !output.value;
}
function setDirection(next: Direction) {
  direction = next;
  document.querySelectorAll<HTMLButtonElement>('.direction').forEach(button => { const active = button.dataset.direction === next; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelector('#input-label')!.textContent = next === 'encode' ? 'DEIN TEXT' : 'DEIN AWASOBABA';
  document.querySelector('#output-label')!.textContent = next === 'encode' ? 'AWASOBABA' : 'DEIN TEXT';
  input.placeholder = next === 'encode' ? 'Hier kommen deine Worte rein …' : 'Hier kommt dein Awasobaba rein …';
  output.placeholder = next === 'encode' ? 'AWASOBABA' : 'Hier erscheinen deine Worte …';
  update();
}
input.addEventListener('input', update);
document.querySelectorAll<HTMLButtonElement>('.direction').forEach(button => button.addEventListener('click', () => setDirection(button.dataset.direction as Direction)));
function swap() { input.value = output.value; setDirection(direction === 'encode' ? 'decode' : 'encode'); input.focus(); }
document.querySelector('#swap')!.addEventListener('click', swap);
document.querySelector('#swap-text')!.addEventListener('click', swap);
document.querySelector('#clear')!.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
document.querySelector('#example')!.addEventListener('click', () => { input.value = direction === 'encode' ? 'Hi' : encode('Hi'); update(); input.focus(); });
copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(output.value); status.textContent = 'Kopiert! Ab in die Welt damit.'; } catch { status.textContent = 'Kopieren hat nicht geklappt. Bitte markiere den Text selbst.'; } });
update();
