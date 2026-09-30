/**
 * Stapel (Stack)
 * --------------
 * Prinzip „zuletzt rein, zuerst raus" (LIFO). Die eigentliche Technik steckt
 * in kette.js – hier stehen nur Beschriftung, Infotext und Code-Beispiele.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

TRACE.strukturen.stapelKonfiguration = {
  modus: "stapel",
  praefix: "stapel",
  standardEingabe: "5, 3, 8, -, 2, -, -",

  info: {
    beschreibung: "Legt Werte übereinander. Das oberste Element ist immer das, das zuerst wieder herunterkommt – „zuletzt rein, zuerst raus“ (LIFO).",
    kennzahlen: [
      ["Push", "O(1)", "Einen Wert oben auflegen"],
      ["Pop", "O(1)", "Den obersten Wert herunternehmen"],
      ["Speicher", "O(n)", "Ein Speicherplatz pro Element"]
    ],
    einsatz: "Rückgängig-Funktionen (Strg+Z), der Aufrufstapel von Funktionen bei Rekursion, Klammern prüfen, Backtracking – zum Beispiel bei der Tiefensuche."
  },

  code: {
    pseudocode: `
      PROZEDUR Push(stapel, wert)
        stapel.oben ← stapel.oben + 1              @@hinzufuegen
        stapel[stapel.oben] ← wert
      ENDE PROZEDUR

      FUNKTION Pop(stapel)
        WENN stapel leer DANN                        @@leer
          RÜCKGABE Fehler „Stapel ist leer“
        ENDE WENN
        wert ← stapel[stapel.oben]                    @@entfernen
        stapel.oben ← stapel.oben − 1
        RÜCKGABE wert
      ENDE FUNKTION
    `,
    csharp: `
      void Push(Stack<int> stapel, int wert)
      {
          stapel.Push(wert);                            @@hinzufuegen
      }

      int Pop(Stack<int> stapel)
      {
          if (stapel.Count == 0)                          @@leer
          {
              throw new InvalidOperationException("Stapel ist leer");
          }
          return stapel.Pop();                              @@entfernen
      }
    `,
    javascript: `
      function push(stapel, wert) {
        stapel.push(wert);                              @@hinzufuegen
      }

      function pop(stapel) {
        if (stapel.length === 0) {                        @@leer
          throw new Error("Stapel ist leer");
        }
        return stapel.pop();                                @@entfernen
      }
    `
  }
};
