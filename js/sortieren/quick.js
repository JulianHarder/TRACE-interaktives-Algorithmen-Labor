/**
 * Quicksort
 * ---------
 * Wählt einen Pivot (hier: das letzte Element des Bereichs) und sortiert die
 * anderen Werte so um, dass kleinere Werte links und größere Werte rechts vom
 * Pivot stehen ("partitionieren", nach Lomuto). Danach steht der Pivot an
 * seinem endgültigen Platz. Beide Seiten werden anschließend genauso sortiert.
 *
 * Besonderheit: Mit dem letzten Element als Pivot wird Quicksort bei bereits
 * sortierten oder umgekehrt sortierten Zahlen zum schlimmsten Fall O(n²) –
 * das lässt sich mit den Eingabe-Varianten direkt ausprobieren.
 */
(function (sortieren) {
  "use strict";

  const { registriere, tausche, indexbereich } = sortieren;

  registriere({
    id: "quick",
    name: "Quicksort",

    info: {
      beschreibung: "Wählt einen Pivot und sortiert die anderen Werte um ihn herum: kleiner nach links, größer nach rechts. Dann geht es mit beiden Seiten genauso weiter.",
      schnitt: "O(n log n)",
      schlimmster: "O(n²)",
      bester: "O(n log n)",
      speicher: "O(log n)",
      stabil: false,
      einsatz: "In der Praxis meist der schnellste Allrounder. Achtung: Bei diesem Pivot (immer das letzte Element) wird er bei bereits sortierten oder umgekehrt sortierten Zahlen zum schlimmsten Fall – einfach unten bei „Eingabe“ ausprobieren."
    },

    code: {
      pseudocode: `
        PROZEDUR QuickSort(a, von, bis)
          WENN von < bis DANN                        @@pruefeBereich
            teiler ← Partition(a, von, bis)           @@partition
            QuickSort(a, von, teiler − 1)              @@rekursionLinks
            QuickSort(a, teiler + 1, bis)              @@rekursionRechts
          ENDE WENN
        ENDE PROZEDUR

        PROZEDUR Partition(a, von, bis)
          pivot ← a[bis]                               @@pivot
          i ← von − 1
          FÜR j ← von BIS bis − 1
            WENN a[j] < pivot DANN                     @@vergleich
              i ← i + 1
              tausche a[i] und a[j]                    @@tauschKlein
            ENDE WENN
          ENDE FÜR
          tausche a[i + 1] und a[bis]                  @@tauschPivot
          RÜCKGABE i + 1
        ENDE PROZEDUR
      `,
      csharp: `
        void QuickSort(int[] a, int von, int bis)
        {
            if (von < bis)                             @@pruefeBereich
            {
                int teiler = Partition(a, von, bis);    @@partition
                QuickSort(a, von, teiler - 1);           @@rekursionLinks
                QuickSort(a, teiler + 1, bis);           @@rekursionRechts
            }
        }

        int Partition(int[] a, int von, int bis)
        {
            int pivot = a[bis];                          @@pivot
            int i = von - 1;

            for (int j = von; j < bis; j++)
            {
                if (a[j] < pivot)                         @@vergleich
                {
                    i++;
                    (a[i], a[j]) = (a[j], a[i]);           @@tauschKlein
                }
            }

            (a[i + 1], a[bis]) = (a[bis], a[i + 1]);       @@tauschPivot
            return i + 1;
        }
      `,
      javascript: `
        function quickSort(a, von, bis) {
          if (von < bis) {                              @@pruefeBereich
            const teiler = partition(a, von, bis);        @@partition
            quickSort(a, von, teiler - 1);                @@rekursionLinks
            quickSort(a, teiler + 1, bis);                @@rekursionRechts
          }
        }

        function partition(a, von, bis) {
          const pivot = a[bis];                            @@pivot
          let i = von - 1;

          for (let j = von; j < bis; j++) {
            if (a[j] < pivot) {                             @@vergleich
              i++;
              [a[i], a[j]] = [a[j], a[i]];                   @@tauschKlein
            }
          }

          [a[i + 1], a[bis]] = [a[bis], a[i + 1]];           @@tauschPivot
          return i + 1;
        }
      `
    },

    sortiere: function* (a) {
      yield* teileUndSortiere(a, 0, a.length - 1);
    }
  });

  function* teileUndSortiere(a, von, bis) {
    if (von >= bis) {
      if (von === bis) {
        yield {
          typ: "platziert",
          indizes: [von],
          platziert: [von],
          zeile: "pruefeBereich",
          variablen: { von, bis },
          text: `Nur ein Element im Bereich (${a[von]}) – das ist automatisch schon richtig einsortiert.`
        };
      }
      return;
    }

    yield {
      typ: "markieren",
      zeile: "partition",
      bereich: { von, bis, text: "wird partitioniert" },
      variablen: { von, bis },
      text: `Bereich ${von}–${bis}: Wähle einen Pivot und sortiere kleinere Werte nach links, größere nach rechts.`
    };

    const teiler = yield* partitioniere(a, von, bis);

    if (von <= teiler - 1) {
      yield {
        typ: "markieren",
        zeile: "rekursionLinks",
        bereich: { von, bis: teiler - 1, text: "linker Teilbereich" },
        variablen: { von, bis, teiler },
        text: `Wende Quicksort jetzt auf den linken Teilbereich ${von}–${teiler - 1} an.`
      };
    }
    yield* teileUndSortiere(a, von, teiler - 1);

    if (teiler + 1 <= bis) {
      yield {
        typ: "markieren",
        zeile: "rekursionRechts",
        bereich: { von: teiler + 1, bis, text: "rechter Teilbereich" },
        variablen: { von, bis, teiler },
        text: `Wende Quicksort jetzt auf den rechten Teilbereich ${teiler + 1}–${bis} an.`
      };
    }
    yield* teileUndSortiere(a, teiler + 1, bis);
  }

  /** Sortiert [von, bis] um den Pivot a[bis] herum. Gibt die Pivot-Position zurück. */
  function* partitioniere(a, von, bis) {
    const pivot = a[bis];
    const bereich = { von, bis, text: "wird partitioniert" };
    let i = von - 1;

    yield {
      typ: "markieren",
      indizes: [bis],
      gemerkt: [bis],
      zeile: "pivot",
      bereich,
      variablen: { von, bis, pivot, i },
      text: `Pivot ist ${pivot} (der letzte Wert im Bereich).`
    };

    for (let j = von; j < bis; j++) {
      const kleiner = a[j] < pivot;

      yield {
        typ: "vergleich",
        indizes: [j, bis],
        gemerkt: [bis],
        zeiger: { i, j },
        zeile: "vergleich",
        bereich,
        variablen: { von, bis, pivot, i, j },
        text: kleiner
          ? `${a[j]} ist kleiner als der Pivot ${pivot} und gehört auf die linke Seite.`
          : `${a[j]} ist nicht kleiner als der Pivot ${pivot} und bleibt auf der rechten Seite.`
      };

      if (kleiner) {
        i++;
        const linksWert = a[i];
        const rechtsWert = a[j];
        tausche(a, i, j);
        yield {
          typ: "tausch",
          indizes: [i, j],
          gemerkt: [bis],
          zeiger: { i, j },
          zeile: "tauschKlein",
          bereich,
          variablen: { von, bis, pivot, i, j },
          text: i === j
            ? `${rechtsWert} ist schon an der richtigen Stelle im linken Teil.`
            : `${rechtsWert} und ${linksWert} tauschen die Plätze.`
        };
      }
    }

    const teiler = i + 1;
    const pivotZielWert = a[teiler];
    tausche(a, teiler, bis);
    yield {
      typ: "tausch",
      indizes: [teiler, bis],
      platziert: [teiler],
      zeiger: { i: teiler },
      zeile: "tauschPivot",
      variablen: { von, bis, pivot, i: teiler, j: undefined },
      text: teiler === bis
        ? `Pivot ${pivot} bleibt an Position ${teiler} – dort steht er jetzt endgültig richtig.`
        : `Pivot ${pivot} tauscht mit ${pivotZielWert} an Position ${teiler} – dort steht er jetzt endgültig richtig.`
    };

    return teiler;
  }
})(window.TRACE.sortieren);
