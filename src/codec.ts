/** A reversible UTF-8 to Awa-So-Ba codec. */
const markers: Record<number, string> = { 0: 'Mehl!', 2: 'zu wenig Mehl!', 4: 'viel zu wenig Mehl!' };

export function encode(text: string): string {
  if (!text) return '';
  const bytes = new TextEncoder().encode(text);
  const blocks: string[] = [];
  let buffer = 0, bits = 0;
  const block = (value: number) => 'awa'.repeat((value >> 4) + 1) + 'so'.repeat(((value >> 2) & 3) + 1) + 'ba'.repeat((value & 3) + 1);
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      blocks.push(block((buffer >> bits) & 63));
      buffer &= (1 << bits) - 1;
    }
  }
  const padding = bits ? 6 - bits : 0;
  if (bits) blocks.push(block(buffer << padding));
  return `${blocks.join(' ')} ${markers[padding]}`;
}

export function decode(input: string): string {
  if (!input.trim()) return '';
  // Match the complete longest marker first, including when it touches the last block.
  const match = input.match(/(viel\s+zu\s+wenig\s+mehl!|zu\s+wenig\s+mehl!|mehl!)\s*$/i);
  if (!match || match.index === undefined) throw new Error('Zu wenig Mehl! Ein gültiger Abschlussmarker fehlt.');
  const marker = match[1].toLowerCase().replace(/\s+/g, ' ');
  const padding = marker === 'mehl!' ? 0 : marker === 'zu wenig mehl!' ? 2 : 4;
  const syllables = input.slice(0, match.index).replace(/\s/g, '').toLowerCase();
  if (!syllables) throw new Error('Zu wenig Mehl! Dieser Awasobaba-Text ist unvollständig.');
  const values: number[] = [];
  let i = 0;
  while (i < syllables.length) {
    let value = 0;
    for (const syllable of ['awa', 'so', 'ba']) {
      let count = 0;
      while (syllables.startsWith(syllable, i)) { count++; i += syllable.length; }
      if (count < 1 || count > 4) throw new Error('Hoppla! Jeder Block braucht 1 bis 4 awa, dann so und dann ba.');
      value = (value << 2) | (count - 1);
    }
    values.push(value);
  }
  const totalBits = values.length * 6;
  if (totalBits <= padding || (totalBits - padding) % 8 !== 0 || (padding && (values[values.length - 1] & ((1 << padding) - 1)) !== 0)) {
    throw new Error('Zu wenig Mehl! Auffüllbits oder Textlänge sind ungültig.');
  }
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const value of values) {
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
      buffer &= (1 << bits) - 1;
    }
  }
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(new Uint8Array(bytes)); }
  catch { throw new Error('Dieser Teig ist kaputt: Die Daten sind kein gültiger UTF-8-Text.'); }
}
