import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { encode, decode } from './codec.ts';

test('Hi nach der definierten Bitregel', () => {
  const expected = 'awaawasobababa awasosobababa awaawaawasosoba zu wenig Mehl!';
  assert.equal(encode('Hi'), expected);
  assert.equal(decode(expected), 'Hi');
});
test('Roundtrips für Unicode, Zeilenumbrüche und Nullbytes', () => {
  for (const text of ['', 'Hello, world!', 'Äpfel und Öl: grüße!', '🫶🏽🍞🚀', 'erste Zeile\nzweite\r\n', '\0\0A\0', '\ufeffBOM']) assert.equal(decode(encode(text)), text);
});
test('alle Padding-Fälle', () => {
  for (const [text, marker] of [['abc', ' Mehl!'], ['ab', ' zu wenig Mehl!'], ['a', ' viel zu wenig Mehl!']]) {
    assert.ok(encode(text).endsWith(marker)); assert.equal(decode(encode(text)), text);
  }
});
test('Großschreibung und flexible Silbenabstände', () => {
  const encoded = encode('Hi');
  assert.equal(decode(encoded.replace(' zu wenig Mehl!', 'zu wenig Mehl!').replace(/ /g, (space, index) => index < encoded.indexOf(' zu wenig Mehl!') ? '' : space)), 'Hi');
  assert.equal(decode('  ' + encoded.toUpperCase().replace(/(AWA|SO|BA)/g, '$1 \n ') + '  '), 'Hi');
});
test('weist ungültige Daten zurück', () => {
  for (const bad of ['awabasoba Mehl!', 'awaawaawaawaawasoba viel zu wenig Mehl!', 'awasoba', 'awasoba falsches Mehl!', 'awasoba viel zu wenig Mehl!', 'awasobaba viel zu wenig Mehl!', 'awasoba! Mehl!', 'awasoba Mehl! extra', 'Mehl!', 'bawasoba Mehl!']) assert.throws(() => decode(bad), undefined, bad);
  // 0xff is not valid UTF-8: 111111 110000, with four zero padding bits.
  assert.throws(() => decode('awaawaawaawasosososobabababa awaawaawaawasoba viel zu wenig Mehl!'), /UTF-8/);
});
