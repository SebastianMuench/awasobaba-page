/** Versioned, reversible Awa-So-Ba formats. */
const paddingMarkers: Record<number, string> = { 0: 'Mehl!', 2: 'zu wenig Mehl!', 4: 'viel zu wenig Mehl!' };
export const MAX_DECOMPRESSED_BYTES = 1024 * 1024;
const ESCAPE = 63;

// Format k1: frequency order is immutable. Changing it requires a new version.
export const COMPACT_CHARACTERS = Object.freeze(Array.from(" enisratdhulcgmobwfkzpvüäößjxyq.,!?'-:;()0123456789EIHDAMSWBK"));
const blockCost = (value: number) => 3 * ((value >> 4) + 1) + 2 * (((value >> 2) & 3) + 1) + 2 * ((value & 3) + 1);
export const COMPACT_VALUES = Object.freeze(Array.from({ length: 63 }, (_, i) => i).sort((a, b) => blockCost(a) - blockCost(b) || a - b));
export const COMPACT_ESCAPE = ESCAPE;
const charToValue = new Map(COMPACT_CHARACTERS.map((character, i) => [character, COMPACT_VALUES[i]]));
const valueToChar = new Map(COMPACT_CHARACTERS.map((character, i) => [COMPACT_VALUES[i], character]));

export function block(value: number): string {
  return 'awa'.repeat((value >> 4) + 1) + 'so'.repeat(((value >> 2) & 3) + 1) + 'ba'.repeat((value & 3) + 1);
}
function parseBlocks(input: string): number[] {
  const syllables = input.replace(/\s/g, '').toLowerCase();
  const values: number[] = [];
  let i = 0;
  while (i < syllables.length) {
    let value = 0;
    for (const syllable of ['awa', 'so', 'ba']) {
      let count = 0;
      while (syllables.startsWith(syllable, i)) { count++; i += syllable.length; }
      if (count < 1 || count > 4) throw new Error('Ungültiger Block: Er braucht 1 bis 4 awa, dann so und dann ba.');
      value = (value << 2) | (count - 1);
    }
    values.push(value);
  }
  return values;
}
function bytesToValues(bytes: Uint8Array): { values: number[]; padding: number } {
  const values: number[] = [];
  let buffer = 0, bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte; bits += 8;
    while (bits >= 6) { bits -= 6; values.push((buffer >> bits) & 63); buffer &= (1 << bits) - 1; }
  }
  const padding = bits ? 6 - bits : 0;
  if (bits) values.push(buffer << padding);
  return { values, padding };
}
function valuesToBytes(values: number[], padding: number): Uint8Array {
  const totalBits = values.length * 6;
  if (totalBits <= padding || (totalBits - padding) % 8 || (padding && (values[values.length - 1] & ((1 << padding) - 1)))) throw new Error('Ungültige Auffüllbits oder Textlänge.');
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const value of values) {
    buffer = (buffer << 6) | value; bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 255); buffer &= (1 << bits) - 1; }
  }
  return Uint8Array.from(bytes);
}
function encodeBytes(bytes: Uint8Array): string {
  if (!bytes.length) return '';
  const { values, padding } = bytesToValues(bytes);
  return `${values.map(block).join(' ')} ${paddingMarkers[padding]}`;
}
function decodeBytes(input: string): Uint8Array {
  const match = input.match(/(viel\s+zu\s+wenig\s+mehl!|zu\s+wenig\s+mehl!|mehl!)\s*$/i);
  if (!match || match.index === undefined) throw new Error('Zu wenig Mehl! Ein gültiger Abschlussmarker fehlt.');
  const marker = match[1].toLowerCase().replace(/\s+/g, ' ');
  const values = parseBlocks(input.slice(0, match.index));
  if (!values.length) throw new Error('Dieser Awasobaba-Text ist unvollständig.');
  return valuesToBytes(values, marker === 'mehl!' ? 0 : marker === 'zu wenig mehl!' ? 2 : 4);
}
function utf8(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw new Error('Die Daten sind kein gültiger UTF-8-Text.'); }
}
export function encode(text: string): string { return encodeBytes(new TextEncoder().encode(text)); }

export function encodeCompact(text: string): string {
  if (!text) return '';
  const values: number[] = [];
  for (const character of text) {
    const value = charToValue.get(character);
    if (value !== undefined) values.push(value);
    else {
      const bytes = new TextEncoder().encode(character);
      values.push(ESCAPE, bytes.length - 1, ...bytesToValues(bytes).values);
    }
  }
  return values.map(block).join(' ') + ' zu wenig Mehl!!';
}
function decodeCompact(payload: string): string {
  const values = parseBlocks(payload);
  if (!values.length) throw new Error('Die kompakte Nachricht ist unvollständig.');
  const output: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value !== ESCAPE) {
      const character = valueToChar.get(value);
      if (character === undefined) throw new Error('Unbekannter kompakter Zeichenblock.');
      output.push(character); continue;
    }
    const lengthValue = values[++i];
    if (lengthValue === undefined || lengthValue > 3) throw new Error('Ungültige Escape-Länge.');
    const length = lengthValue + 1;
    const count = Math.ceil(length * 8 / 6);
    if (i + count >= values.length) throw new Error('Unvollständige Escape-Sequenz.');
    const bytes = valuesToBytes(values.slice(i + 1, i + 1 + count), count * 6 - length * 8);
    const character = utf8(bytes);
    if (Array.from(character).length !== 1 || new TextEncoder().encode(character).length !== length) throw new Error('Ungültiges Escape-Zeichen.');
    output.push(character); i += count;
  }
  return output.join('');
}
async function transform(bytes: Uint8Array, decompress: boolean): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') throw new Error('Komprimierte Nachrichten werden von diesem Browser nicht unterstützt.');
  const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(decompress ? new DecompressionStream('gzip') : new CompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.length;
      if (decompress && length > MAX_DECOMPRESSED_BYTES) { await reader.cancel(); throw new Error('Die entpackte Nachricht ist größer als 1 MiB.'); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('1 MiB')) throw error;
    throw new Error(decompress ? 'Die komprimierten Daten sind beschädigt oder unvollständig.' : 'Die Komprimierung ist fehlgeschlagen.');
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
export type EncodingResult = { output: string; format: 'legacy' | 'gzip' | 'compact'; legacyLength: number };
export async function encodeBest(text: string): Promise<EncodingResult> {
  const bytes = new TextEncoder().encode(text);
  const legacy = encodeBytes(bytes);
  let best: EncodingResult = { output: legacy, format: 'legacy', legacyLength: legacy.length };
  if (!bytes.length) return best;
  if (bytes.length <= MAX_DECOMPRESSED_BYTES && typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
    const candidate = 'Mehl v1! ' + encodeBytes(await transform(bytes, false));
    if (candidate.length < best.output.length) best = { ...best, output: candidate, format: 'gzip' };
  }
  const compact = encodeCompact(text);
  if (compact.length < best.output.length) best = { ...best, output: compact, format: 'compact' };
  return best;
}
export async function decode(input: string): Promise<string> {
  if (!input.trim()) return '';
  const trimmed = input.trim();
  const compactSuffix = trimmed.match(/(?:^|\s)(?:(?:!!|extra)\s+zu\s+wenig\s+mehl!|zu\s+wenig\s+mehl!!)\s*$/i);
  if (compactSuffix && compactSuffix.index !== undefined) return decodeCompact(trimmed.slice(0, compactSuffix.index));
  if (/^(?:awa|so|ba|\s)+$/i.test(trimmed)) return decodeCompact(trimmed);
  const version = trimmed.match(/^mehl\s+([a-z]\d+)!\s*/i);
  if (version) {
    const payload = trimmed.slice(version[0].length);
    if (!payload) throw new Error('Die Nachricht ist unvollständig.');
    const type = version[1].toLowerCase();
    if (type === 'v1') return utf8(await transform(decodeBytes(payload), true));
    throw new Error('Unbekannte Awasobaba-Formatversion.');
  }
  if (/^mehl\s+[a-z]/i.test(trimmed)) throw new Error('Ungültiger Awasobaba-Formatmarker.');
  return utf8(decodeBytes(input));
}
