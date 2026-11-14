import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { gzipSync } from 'node:zlib';
import { encode, encodeCompact, encodeBest, decode, block, COMPACT_CHARACTERS, COMPACT_VALUES, COMPACT_ESCAPE, MAX_DECOMPRESSED_BYTES } from './codec.ts';

function encodeRaw(bytes: Uint8Array): string {
  let buffer = 0, bits = 0; const blocks: string[] = [];
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte; bits += 8;
    while (bits >= 6) { bits -= 6; blocks.push(block((buffer >> bits) & 63)); buffer &= (1 << bits) - 1; }
  }
  const padding = bits ? 6 - bits : 0;
  if (bits) blocks.push(block(buffer << padding));
  return blocks.join(' ') + ' ' + ({ 0:'Mehl!', 2:'zu wenig Mehl!', 4:'viel zu wenig Mehl!' } as Record<number, string>)[padding];
}
const gzipMessage = (bytes: Uint8Array) => `Mehl v1! ${encodeRaw(bytes)}`;

test('dictionary and control assignments are unique and inverse; cost order is deterministic', async () => {
  assert.equal(new Set(COMPACT_CHARACTERS).size, COMPACT_CHARACTERS.length);
  assert.equal(new Set([...COMPACT_VALUES.slice(0, COMPACT_CHARACTERS.length), COMPACT_ESCAPE]).size, COMPACT_CHARACTERS.length + 1);
  const cost = (v: number) => block(v).length;
  for (let i = 1; i < COMPACT_VALUES.length; i++) assert.ok(cost(COMPACT_VALUES[i - 1]) < cost(COMPACT_VALUES[i]) || (cost(COMPACT_VALUES[i - 1]) === cost(COMPACT_VALUES[i]) && COMPACT_VALUES[i - 1] < COMPACT_VALUES[i]));
  for (let i = 0; i < COMPACT_CHARACTERS.length; i++) {
    assert.equal(encodeCompact(COMPACT_CHARACTERS[i]), block(COMPACT_VALUES[i]) + ' zu wenig Mehl!!');
    assert.equal(await decode(encodeCompact(COMPACT_CHARACTERS[i])), COMPACT_CHARACTERS[i]);
  }
});
test('compact round trips all requested text and flexible block spacing', async () => {
  for (const text of ['Hi', "Hallo, wie geht's?", 'Bin gleich da :D', 'Können wir uns später treffen?', 'Awasobaba, zu wenig Mehl!', '😂🔥👀', 'ÄÖÜ äöü ß 0123456789?!', '\t\n\r\0', 'e\u0301 x\0 😀\n👀', '\ufeff']) {
    const encoded = encodeCompact(text);
    assert.equal(await decode(encoded), text);
    assert.equal(await decode(encoded.replace(/(awa|so|ba)/g, '$1 \n ').toUpperCase()), text);
    assert.equal(await decode(encoded.replace(/ zu wenig Mehl!!$/, '').replace(/\s/g, '') + ' zu wenig Mehl!!'), text);
    assert.equal(await decode(encoded.replace(/ zu wenig Mehl!!$/, '')), text);
    assert.equal(await decode(encoded.replace(' zu wenig Mehl!!', ' extra zu wenig Mehl!')), text);
    assert.equal(await decode((await encodeBest(text)).output), text);
  }
  await assert.rejects(decode('Mehl k1! ' + block(COMPACT_VALUES[0])));
  assert.equal(encodeCompact(''), ''); assert.equal(await decode(''), '');
});
test('rejects invalid, truncated, overlong and malformed escapes', async () => {
  const esc = block(COMPACT_ESCAPE);
  for (const sequence of [esc, esc + block(4), esc + block(0), esc + block(3) + block(0), esc + block(0) + block(0) + block(1), esc + block(0) + block(63) + block(48), esc + block(1) + block(0) + block(0) + block(0)]) {
    await assert.rejects(decode(sequence));
  }
  const unused = COMPACT_VALUES[COMPACT_CHARACTERS.length];
  await assert.rejects(decode(block(unused)));
  for (const bad of ['Mehl k2! awasoba', 'Mehl v2! awasoba', 'Mehl k1 awasoba', 'Mehl k1!', 'Mehl k1! awasobaba!', 'Mehl k1! awabasoba']) await assert.rejects(decode(bad));
});
test('legacy and gzip messages remain compatible, including all padding cases', async () => {
  const hi = 'awaawasobababa awasosobababa awaawaawasosoba zu wenig Mehl!';
  assert.equal(encode('Hi'), hi); assert.equal(await decode(hi), 'Hi');
  for (const text of ['a','ab','abc','Äpfel 🫶🏽\n\0']) {
    assert.equal(await decode(encode(text)), text);
    assert.equal(await decode(gzipMessage(gzipSync(text))), text);
  }
  const broken = gzipSync('hello');
  await assert.rejects(decode(gzipMessage(broken.subarray(0, broken.length - 3))), /beschädigt|unvollständig/);
  await assert.rejects(decode(gzipMessage(gzipSync(new Uint8Array(MAX_DECOMPRESSED_BYTES + 1)))), /1 MiB/);
  await assert.rejects(decode('awaawaawaawasosososobabababa awaawaawaawasoba viel zu wenig Mehl!'), /UTF-8/);
});
test('selects shortest complete output and retains existing formats on ties', async () => {
  for (const text of ['', 'Hi', 'abcabcabcabcabcabcabc!!', "Hallo, wie geht's?", 'abcde '.repeat(200), '😂🔥👀']) {
    const legacy = encode(text);
    const compact = encodeCompact(text);
    const gzip = text ? gzipMessage(new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())) : '';
    const existing = gzip && gzip.length < legacy.length ? gzip : legacy;
    const expected = compact.length < existing.length ? compact : existing;
    assert.equal((await encodeBest(text)).output, expected);
  }
});
