/**
 * Insertion Sort
 * --------------
 * Nimmt eine Zahl nach der anderen und lässt sie so lange nach links rutschen,
 * bis sie im bereits sortierten Teil an der richtigen Stelle steht –
 * wie beim Einsortieren von Spielkarten auf der Hand.
 *
 * Diese Variante tauscht benachbarte Elemente. Das ist gleichwertig zur
 * Variante mit Verschieben und einem Hilfswert, aber leichter zu verfolgen.
 */
(function (sortieren) {
  "use strict";

  const { registriere, tausche } = sortieren;

  registriere({
    id: "insertion",
    name: "Insertion Sort",

    info: {
      beschreibung: "Nimmt eine Zahl nach der anderen und schiebt sie links an die passende Stelle – wie beim Sortieren von Spielkarten auf der Hand.",
      schnitt: "O(n²)",
      schlimmster: "O(n²)",
      bester: "O(n)",
      speicher: "O(1)",
      stabil: true,
      einsatz: "Für kleine oder fast sortierte Daten. Schnelle Verfahren nutzen ihn oft für kleine Teilstücke."
    },

    code: {
      pseudocode: `
        PROZEDUR InsertionSort(a)
          n ← Länge(a)
          FÜR i ← 1 BIS n − 1
            j ← i                                    @@naechstes
            SOLANGE j > 0 UND a[j − 1] > a[j]        @@vergleich
              tausche a[j − 1] und a[j]              @@tausch
              j ← j − 1
            ENDE SOLANGE
          ENDE FÜR
        ENDE PROZEDUR                                @@ende
      `,
      csharp: `
        void InsertionSort(int[] a)
        {
            int n = a.Length;
            for (int i = 1; i < n; i++)
            {
                int j = i;                              @@naechstes
                while (j > 0 && a[j - 1] > a[j])          @@vergleich
                {
                    (a[j - 1], a[j]) = (a[j], a[j - 1]);   @@tausch
                    j--;
                }
            }
        }                                                  @@ende
      `,
      javascript: `
        function insertionSort(a) {
          const n = a.length;
          for (let i = 1; i < n; i++) {
            let j = i;                              @@naechstes
            while (j > 0 && a[j - 1] > a[j]) {        @@vergleich
              [a[j - 1], a[j]] = [a[j], a[j - 1]];      @@tausch
              j--;
            }
          }
        }                                                @@ende
      `
    },

    sortiere: function* (a) {
      const n = a.length;

      for (let i = 1; i < n; i++) {
        const bereich = { von: 0, bis: i - 1, text: "sortierter Teil" };
        let j = i;

        yield {
          typ: "markieren",
          indizes: [j],
          gemerkt: [j],
          zeiger: { i, j },
          zeile: "naechstes",
          bereich,
          variablen: { n, i, j },
          text: `Nimm ${a[i]} und füge es links in den sortierten Teil ein.`
        };

        while (true) {
          // Erste Bedingung der Schleife: j > 0. Ist sie falsch, wird a[] gar nicht verglichen.
          if (j === 0) {
            yield {
              typ: "markieren",
              gemerkt: [j],
              zeiger: { i, j },
              zeile: "vergleich",
              bereich,
              variablen: { n, i, j },
              text: `j ist 0: ${a[0]} ist ganz vorne angekommen und damit die bisher kleinste Zahl.`
            };
            break;
          }

          const links = a[j - 1];
          const aktuell = a[j];
          const falschHerum = links > aktuell;

          yield {
            typ: "vergleich",
            indizes: [j - 1, j],
            gemerkt: [j],
            zeiger: { i, j },
            zeile: "vergleich",
            bereich,
            variablen: { n, i, j },
            text: falschHerum
              ? `${links} ist größer als ${aktuell}, also rutscht ${aktuell} eins nach links.`
              : `${links} ist nicht größer als ${aktuell}. ${aktuell} hat seinen Platz im sortierten Teil gefunden.`
          };

          if (!falschHerum) break;

          tausche(a, j - 1, j);
          yield {
            typ: "tausch",
            indizes: [j - 1, j],
            gemerkt: [j - 1],
            zeiger: { i, j },
            zeile: "tausch",
            bereich,
            variablen: { n, i, j },
            text: `${aktuell} und ${links} haben die Plätze getauscht.`
          };
          j--;
        }
      }
    }
  });
})(window.TRACE.sortieren);
