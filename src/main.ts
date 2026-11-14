import './style.css';
import { encode, encodeBest, decode } from './codec';

type Direction = 'encode' | 'decode';
let direction: Direction = 'encode';
const starIcon = '<svg class="ornament" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M4.2 19.8 19.8 4.2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const sparkleIcon = '<svg class="ornament" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1c1.5 7 4 9.5 11 11-7 1.5-9.5 4-11 11C10.5 16 8 13.5 1 12c7-1.5 9.5-4 11-11Z" fill="currentColor"/></svg>';
const arrowIcon = '<svg class="ornament" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const diagonalArrowIcon = '<svg class="ornament" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 18 12-12M7 6h11v11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const swapIcon = '<svg class="ornament" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16m-5-5 5 5-5 5M20 17H4m5-5-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="page-shell">
    <header class="topbar"><a class="brand" href="#top" aria-label="Awasobaba Startseite"><span class="brand-icon" aria-hidden="true">${starIcon}</span> awasobaba<span class="brand-dot">.</span></a></header>
    <main id="top">
      <section class="hero" aria-labelledby="title">
        <div class="hero-copy"><h1 id="title">Worte rein.<br><em>Awasobaba</em> raus<span class="hero-dot">.</span></h1></div>
        <div class="hero-art" aria-hidden="true"><div class="art-spark spark-one">${starIcon}</div><div class="art-spark spark-two">${sparkleIcon}</div><img class="hero-illustration" src="/backerin.png" alt=""></div>
      </section>
      <section class="translator" aria-label="Awasobaba-Übersetzer">
        
        <div class="direction-tabs" role="group" aria-label="Richtung wählen"><button class="direction active" data-direction="encode" aria-pressed="true" aria-label="Text zu Awasobaba">Text <span>${arrowIcon}</span> Awasobaba</button><button class="direction" data-direction="decode" aria-pressed="false" aria-label="Awasobaba zu Text">Awasobaba <span>${arrowIcon}</span> Text</button></div>
        <div class="fields"><div class="field"><div class="field-heading"><label id="input-label" for="input">DEIN TEXT</label><span id="input-count">0 Zeichen</span></div><textarea id="input" spellcheck="false" placeholder="Hier kommen deine Worte rein …"></textarea><div class="field-bottom"><span></span><button id="example" class="text-button" type="button">Beispiel laden <span>${diagonalArrowIcon}</span></button></div></div>
        <button id="swap" class="swap" type="button" aria-label="Richtung wechseln" title="Richtung wechseln">${swapIcon}</button>
        <div class="field output-field"><div class="field-heading"><label id="output-label" for="output">AWASOBABA</label><span id="output-count">0 Zeichen</span></div><textarea id="output" readonly placeholder="AWASOBABA"></textarea><div class="field-bottom"><span></span><span id="codec-status" role="status" aria-live="polite"></span></div></div></div>
        <div id="error" class="error" role="alert" hidden></div>
        <div class="actions"><div class="action-left"><button id="copy" class="button primary" type="button">Kopieren <span>${diagonalArrowIcon}</span></button><button id="clear" class="button secondary" type="button">Leeren</button><button id="swap-text" class="mobile-swap" type="button">${swapIcon} &nbsp; Richtung wechseln</button></div><span id="copy-status" class="copy-status" role="status" aria-live="polite"></span><span class="privacy"><span>${starIcon}</span> Bleibt alles in deinem Browser.</span></div>
      </section>
      <section class="bottom-row"><details><summary><span><span class="summary-icon">?</span> Wie funktioniert’s?</span><span class="plus" aria-hidden="true">+</span></summary><div class="details-content">
        <p>Jeder Block folgt demselben Rhythmus: erst 1 bis 4 mal <strong>awa</strong>, dann 1 bis 4 mal <strong>so</strong>, dann 1 bis 4 mal <strong>ba</strong>.</p>
        <p><strong>Kompakt:</strong> Eine feste Zeichentabelle ordnet häufigen Zeichen kurze Blöcke zu. Zum Beispiel wird <strong>e</strong> zu <strong>awasobaba</strong>. Andere Zeichen, etwa Emojis, werden über eine spezielle Folge von Blöcken als UTF-8 gespeichert. Groß- und Kleinschreibung, Leerzeichen und Zeilenumbrüche bleiben erhalten.</p>
        <p><strong>Automatisch die kürzeste Ausgabe:</strong> Die Website vergleicht die kompakte Variante mit der ursprünglichen UTF-8-Kodierung und, wenn vom Browser unterstützt, einer komprimierten Variante. Sie zählt dabei auch Leerzeichen und Abschlussmarker mit. Bei der ursprünglichen Kodierung werden die UTF-8-Bytes in 6-Bit-Gruppen zerlegt; bei der komprimierten Variante werden sie vorher mit gzip komprimiert.</p>
        <p>Die kompakte Ausgabe endet mit <strong>zu wenig Mehl!!</strong>. Bei der ursprünglichen und der komprimierten Variante gibt der Mehl-Abschlussmarker an, wie viele Auffüllbits entfernt werden müssen. Beim Zurückübersetzen wird das passende Format automatisch erkannt. Alles passiert lokal in deinem Browser.</p>
      </div></details><div class="baba-badge" aria-label="Mit extra Baba"><div class="bottom-stamp" aria-hidden="true"><img src="/baba.png" alt=""></div><span class="baba-badge-text" aria-hidden="true">MIT EXTRA<br><strong>BABA<span>.</span></strong></span></div></section>
    </main><footer><span>©&#xfe0e; AWASOBABA · MIT MEHL GEMACHT</span><span>WENIGER BLABLA, MEHR BABA. ${starIcon}</span></footer>
  </div>`;
const input = document.querySelector<HTMLTextAreaElement>('#input')!;
const output = document.querySelector<HTMLTextAreaElement>('#output')!;
const error = document.querySelector<HTMLDivElement>('#error')!;
const status = document.querySelector<HTMLSpanElement>('#copy-status')!;
const copy = document.querySelector<HTMLButtonElement>('#copy')!;
const count = (text: string) => `${Array.from(text).length} Zeichen`;
let generation = 0;
let loadingTimer: ReturnType<typeof setTimeout> | undefined;
const codecStatus = document.querySelector<HTMLSpanElement>('#codec-status')!;
const swapButtons = document.querySelectorAll<HTMLButtonElement>('#swap, #swap-text');
async function update() {
  const current = ++generation;
  const text = input.value;
  const mode = direction;
  status.textContent = '';
  document.querySelector('#input-count')!.textContent = count(text);
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => { codecStatus.textContent = 'Wird umgewandelt …'; }, 200);
  output.setAttribute('aria-busy', 'true');
  copy.disabled = true;
  swapButtons.forEach(button => { button.disabled = true; });
  try {
    const result = mode === 'encode' ? await encodeBest(text) : { output: await decode(text), format: 'legacy' as const, legacyLength: 0 };
    if (current !== generation) return;
    output.value = result.output;
    const savings = result.legacyLength ? Math.round((1 - result.output.length / result.legacyLength) * 100) : 0;
    codecStatus.textContent = mode === 'decode' ? '' : result.format === 'compact' ? `Kompakt · ${savings} % kürzer` : result.format === 'gzip' ? `Komprimiert · ${savings} % kürzer` : 'Unkomprimiert';
    error.hidden = true;
  } catch (err) {
    if (current !== generation) return;
    output.value = '';
    codecStatus.textContent = '';
    error.textContent = err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen.';
    error.hidden = false;
  }
  clearTimeout(loadingTimer);
  output.removeAttribute('aria-busy');
  document.querySelector('#output-count')!.textContent = count(output.value);
  copy.disabled = !output.value;
  swapButtons.forEach(button => { button.disabled = false; });
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
