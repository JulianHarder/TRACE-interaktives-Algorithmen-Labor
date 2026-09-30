/**
 * Selection Sort
 * --------------
 * Sucht im unsortierten Teil die kleinste Zahl und tauscht sie an den Anfang
 * dieses Teils. Danach ist der sortierte Teil vorne um ein Element länger.
 */
(function (sortieren) {
  "use strict";

  const { registriere, tausche } = sortieren;

  registriere({
    id: "selection",
    name: "Selection Sort",

    info: {
      beschreibung: "Sucht im unsortierten Teil die kleinste Zahl und setzt sie an den Anfang dieses Teils. Danach geht es mit dem Rest weiter.",
      schnitt: "O(n²)",
      schlimmster: "O(n²)",
      bester: "O(n²)",
      speicher: "O(1)",
      stabil: false,
      einsatz: "Wenn Schreibzugriffe teuer sind: Selection Sort braucht höchstens n − 1 Vertauschungen."
    },

    code: {
      pseudocode: `
        PROZEDUR SelectionSort(a)
          n ← Länge(a)
          FÜR i ← 0 BIS n − 2
            min ← i                                  @@minStart
            FÜR j ← i + 1 BIS n − 1
              WENN a[j] < a[min] DANN                @@vergleich
                min ← j                              @@neuesMin
              ENDE WENN
            ENDE FÜR
            WENN min ≠ i DANN                        @@pruefeTausch
              tausche a[i] und a[min]                @@tausch
            ENDE WENN
          ENDE FÜR
        ENDE PROZEDUR                                @@ende
      `,
      csharp: `
        void SelectionSort(int[] a)
        {
            int n = a.Length;
            for (int i = 0; i < n - 1; i++)
            {
                int min = i;                           @@minStart
                for (int j = i + 1; j < n; j++)
                {
                    if (a[j] < a[min])                   @@vergleich
                    {
                        min = j;                           @@neuesMin
                    }
                }
                if (min != i)                             @@pruefeTausch
                {
                    (a[i], a[min]) = (a[min], a[i]);        @@tausch
                }
            }
        }                                                    @@ende
      `,
      javascript: `
        function selectionSort(a) {
          const n = a.length;
          for (let i = 0; i < n - 1; i++) {
            let min = i;                             @@minStart
            for (let j = i + 1; j < n; j++) {
              if (a[j] < a[min]) {                     @@vergleich
                min = j;                                 @@neuesMin
              }
            }
            if (min !== i) {                           @@pruefeTausch
              [a[i], a[min]] = [a[min], a[i]];            @@tausch
            }
          }
        }                                                  @@ende
      `
    },

    sortiere: function* (a) {
      const n = a.length;

      for (let i = 0; i < n - 1; i++) {
        const bereich = { von: i, bis: n - 1, text: "Suchbereich" };
        let min = i;

        yield {
          typ: "markieren",
          indizes: [i],
          gemerkt: [min],
          zeiger: { i, min },
          zeile: "minStart",
          bereich,
          variablen: { n, i, j: undefined, min },
          text: `Durchlauf ${i + 1}: Suche die kleinste Zahl ab Position ${i}. Merke dir zuerst ${a[i]} als bisheriges Minimum.`
        };

        for (let j = i + 1; j < n; j++) {
          const kleiner = a[j] < a[min];

          yield {
            typ: "vergleich",
            indizes: [j, min],
            gemerkt: [min],
            zeiger: { i, j, min },
            zeile: "vergleich",
            bereich,
            variablen: { n, i, j, min },
            text: kleiner
              ? `${a[j]} ist kleiner als das bisherige Minimum ${a[min]}.`
              : `${a[j]} ist nicht kleiner als das bisherige Minimum ${a[min]}, also geht die Suche weiter.`
          };

          if (kleiner) {
            min = j;
            yield {
              typ: "markieren",
              indizes: [min],
              gemerkt: [min],
              zeiger: { i, j, min },
              zeile: "neuesMin",
              bereich,
              variablen: { n, i, j, min },
              text: `Neues Minimum: ${a[min]} an Position ${min}.`
            };
          }
        }

        if (min !== i) {
          const kleinste = a[min];
          const verdraengt = a[i];
          tausche(a, i, min);
          yield {
            typ: "tausch",
            indizes: [i, min],
            zeiger: { i, min },
            platziert: [i],
            zeile: "tausch",
            variablen: { n, i, j: undefined, min },
            text: `${kleinste} ist die kleinste Zahl im Suchbereich und tauscht mit ${verdraengt} den Platz. Position ${i} ist jetzt fertig.`
          };
        } else {
          yield {
            typ: "platziert",
            indizes: [i],
            zeiger: { i, min },
            platziert: [i],
            zeile: "pruefeTausch",
            variablen: { n, i, j: undefined, min },
            text: `${a[i]} ist schon die kleinste Zahl und steht bereits richtig. Kein Tausch nötig.`
          };
        }
      }
    }
  });
})(window.TRACE.sortieren);
