# Awasobaba

Eine kleine, lokale Sprachbäckerei: Text wird im Browser in Awasobaba kodiert und wieder zurückübersetzt. Es gibt weder Backend noch Speicherung oder Übertragung der Eingaben. Das Verfahren ist **keine Verschlüsselung**.

## Starten

```sh
npm install
npm run dev
```

Die angezeigte lokale Adresse im Browser öffnen. `npm test` prüft den Codec, `npm run build` erstellt den Produktionsbuild in `dist/`.

## Format

Der Text wird als UTF-8 kodiert. Ein Bitpuffer zerlegt die Bytes in 6-Bit-Gruppen; die letzte Gruppe wird rechts mit Nullbits aufgefüllt. Je zwei Bits bestimmen die Anzahl einer Silbe: 00 = 1, 01 = 2, 10 = 3, 11 = 4. Jeder Block besteht strikt aus awa, dann so, dann ba. Blöcke werden durch Leerzeichen getrennt; beim Lesen sind Leerzeichen und Groß-/Kleinschreibung flexibel. Der Abschlussmarker `Mehl!`, `zu wenig Mehl!` oder `viel zu wenig Mehl!` steht für 0, 2 beziehungsweise 4 Auffüllbits. Leerer Text entspricht leerer Ausgabe.
