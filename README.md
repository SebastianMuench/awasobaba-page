# Awasobaba

A small browser-based app that converts text into Awasobaba and back. Inputs are neither stored nor sent anywhere. This is an encoding, **not encryption**.

## Getting started

```sh
npm install
npm run dev
```

Open the local address shown in the terminal. Run `npm test` to check the codec and `npm run build` to create a production build in `dist/`. The tests require Node.js 22.6 or newer.

## Format

Text is encoded as UTF-8. A bit buffer divides the bytes into 6-bit groups, padding the last group with zero bits on the right when needed. Each pair of bits determines a syllable count: 00 = 1, 01 = 2, 10 = 3, 11 = 4. Each block contains awa, then so, then ba. Encoded blocks are separated by spaces; decoding accepts flexible whitespace and capitalization. The ending markers `Mehl!`, `zu wenig Mehl!`, and `viel zu wenig Mehl!` indicate 0, 2, and 4 padding bits respectively. Empty text maps to empty output.
