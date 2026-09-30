/**
 * Warteschlange (Queue)
 * ---------------------
 * Prinzip „zuerst rein, zuerst raus" (FIFO). Die eigentliche Technik steckt
 * in kette.js – hier stehen nur Beschriftung, Infotext und Code-Beispiele.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

TRACE.strukturen.warteschlangeKonfiguration = {
  modus: "warteschlange",
  praefix: "warteschlange",
  standardEingabe: "5, 3, 8, -, 2, -, -",

  info: {
    beschreibung: "Reiht Werte hintereinander ein. Das vorderste Element ist immer das, das zuerst wieder herauskommt – „zuerst rein, zuerst raus“ (FIFO).",
    kennzahlen: [
      ["Enqueue", "O(1)", "Einen Wert hinten anstellen"],
      ["Dequeue", "O(1)", "Den vordersten Wert entfernen"],
      ["Speicher", "O(n)", "Ein Speicherplatz pro Element"]
    ],
    einsatz: "Wartelisten und Druckaufträge, bei denen die Reihenfolge fair bleiben soll, und die Grundlage der Breitensuche (BFS)."
  },

  code: {
    pseudocode: `
      PROZEDUR Enqueue(schlange, wert)
        schlange.hinten ← schlange.hinten + 1        @@hinzufuegen
        schlange[schlange.hinten] ← wert
      ENDE PROZEDUR

      FUNKTION Dequeue(schlange)
        WENN schlange leer DANN                        @@leer
          RÜCKGABE Fehler „Warteschlange ist leer“
        ENDE WENN
        wert ← schlange[schlange.vorne]                  @@entfernen
        schlange.vorne ← schlange.vorne + 1
        RÜCKGABE wert
      ENDE FUNKTION
    `,
    csharp: `
      void Enqueue(Queue<int> schlange, int wert)
      {
          schlange.Enqueue(wert);                          @@hinzufuegen
      }

      int Dequeue(Queue<int> schlange)
      {
          if (schlange.Count == 0)                           @@leer
          {
              throw new InvalidOperationException("Warteschlange ist leer");
          }
          return schlange.Dequeue();                            @@entfernen
      }
    `,
    javascript: `
      function enqueue(schlange, wert) {
        schlange.push(wert);                              @@hinzufuegen
      }

      function dequeue(schlange) {
        if (schlange.length === 0) {                        @@leer
          throw new Error("Warteschlange ist leer");
        }
        return schlange.shift();                              @@entfernen
      }
    `
  }
};
