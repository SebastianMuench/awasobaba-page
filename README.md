# Awasobaba

A browser-based app that converts text into Awasobaba and back. Inputs are neither stored nor sent anywhere. This is an encoding, **not encryption**.

## Getting started

```sh
npm install
npm run dev
```

Open the local address shown in the terminal. Run `npm test` to check the codec and `npm run build` to create a production build in `dist/`. The tests require Node.js 22.6 or newer.

## Shared block format

A block contains 1–4 repetitions of `awa`, then 1–4 of `so`, then 1–4 of `ba`. The counts encode a 6-bit value: `((awa − 1) << 4) | ((so − 1) << 2) | (ba − 1)`. Blocks are self-delimiting and can be separated by arbitrary whitespace. Decoding ignores case in encoded data and metadata. Empty text maps to empty output.

## Legacy and gzip formats

Legacy text is encoded as UTF-8 bytes, split into 6-bit values, padding the last group with zero bits on the right as needed. Blocks are separated by spaces and followed by `Mehl!`, `zu wenig Mehl!`, or `viel zu wenig Mehl!` for 0, 2, or 4 padding bits respectively.

Gzip version 1 prefixes the legacy byte representation of the gzip stream with `Mehl v1! `, retaining the same independent padding marker. Decompression rejects malformed data and is limited to 1 MiB (1,048,576 bytes), enforced while reading. Inputs over that limit are not gzip candidates. Native browser `CompressionStream` and `DecompressionStream` with gzip are required for this format; without them, it is skipped during encoding and produces a clear error during decoding. Existing legacy and gzip messages are supported.

## Compact format k1

Compact k1 messages end in `zu wenig Mehl!!`. The earlier `extra zu wenig Mehl!` and `!! zu wenig Mehl!` endings remain readable. The encoder separates blocks with spaces; optional whitespace between (or inside) syllables is ignored. Earlier unmarked compact messages remain readable. Legacy messages use a different ending marker and gzip messages use a version prefix, so they are dispatched separately. A truncated legacy message whose marker is missing can be interpreted as an older unmarked compact message. The earlier experimental `Mehl k1!` prefix and `Kompakt Mehl!` suffix are not supported. Compact messages do not require whole-message padding; their ending identifies the format. Each dictionary character is one block. The following table is the immutable k1 dictionary: entries are character → numeric block value. Space is written as `SPACE`. Future dictionary changes require a new version.

```text
SPACE 0   e 1    n 4    i 16   s 2    r 5    a 8    t 17
 d 20     h 3    u 6    l 9    c 12   g 32   m 18   o 21
 b 24     w 7    f 10   k 13   z 33   p 36   v 19   ü 22
 ä 25     ö 28   ß 48   j 11   x 14   y 34   q 37   . 40
 , 23     ! 26   ? 29   ' 49   - 52   : 15   ; 35   ( 38
 ) 41     0 44   1 27   2 30   3 50   4 53   5 56   6 39
 7 42     8 45   9 31   E 51   I 54   H 57   D 60   A 43
 M 46     S 55   W 58   B 61   K 47
```

Block values are assigned in the frequency order shown. Available values 0–62 are sorted by block character cost `3 × awaCount + 2 × soCount + 2 × baCount`, then numeric value; 62 and 59 remain unused. Value 63 is the escape control and is not a dictionary entry.

For each Unicode scalar outside the dictionary, the encoder emits escape block 63, a length block with value `UTF-8 byte length − 1` (0–3), and `ceil(byte length × 8 / 6)` data blocks. UTF-8 bytes are divided into six-bit values in the legacy bit order, with zero bits padded on the right of the final value. The length determines the exact number of payload blocks and padding bits; there is no separate payload marker. An escape must contain exactly one valid UTF-8 scalar. Truncated escapes, invalid length values, nonzero padding, invalid UTF-8, unused block values, malformed markers, and unknown versions are rejected.

For nonempty input the encoder compares complete legacy, gzip (when available), and compact outputs, including all markers and separators. It chooses the shortest; ties preserve the existing legacy/gzip choice. No dictionary is transmitted. Older app versions cannot decode the current compact ending or gzip messages. All processing is local.
