/**
 * Merge Sort
 * ----------
 * Teilt das Array immer wieder in der Mitte, bis nur noch einzelne Elemente
 * übrig sind (die sind automatisch sortiert). Danach werden die Hälften
 * paarweise wieder zusammengefügt ("verschmelzen"), und zwar so, dass beim
 * Verschmelzen zweier sortierter Hälften auch das Ergebnis sortiert ist.
 *
 * Besonderheit gegenüber Bubble/Selection/Insertion Sort: Eine Zahl steht
 * meist erst ganz am Ende endgültig richtig. Ein Zwischenergebnis einer
 * kleinen Verschmelzung kann später noch einmal an eine andere Stelle
 * wandern, wenn zwei größere Hälften zusammengeführt werden. Deshalb wird
 * hier nur der allerletzte, äußerste Verschmelzungsschritt grün markiert.
 */
(function (sortieren) {
  "use strict";

  const { registriere, indexbereich } = sortieren;

  registriere({
    id: "merge",
    name: "Merge Sort",

    info: {
      beschreibung: "Teilt die Zahlen immer wieder in der Mitte, bis einzelne Zahlen übrig sind, und fügt sie dann sortiert wieder zusammen.",
      schnitt: "O(n log n)",
      schlimmster: "O(n log n)",
      bester: "O(n log n)",
      speicher: "O(n)",
      stabil: true,
      einsatz: "Wenn die Laufzeit garantiert gut bleiben muss, egal wie die Eingabe aussieht. Braucht dafür zusätzlichen Speicher für die Hälften. Anders als bei den anderen Verfahren stehen die Zahlen hier meist erst ganz am Ende endgültig richtig – das ist normal."
    },

    code: {
      pseudocode: `
        PROZEDUR MergeSort(a, von, bis)
          WENN von < bis DANN                        @@teile
            mitte ← (von + bis) DIV 2
            MergeSort(a, von, mitte)                 @@rekursionLinks
            MergeSort(a, mitte + 1, bis)              @@rekursionRechts
            Verschmelze(a, von, mitte, bis)           @@verschmelzeStart
          ENDE WENN
        ENDE PROZEDUR

        PROZEDUR Verschmelze(a, von, mitte, bis)
          links ← a[von … mitte]
          rechts ← a[mitte + 1 … bis]
          i ← 0
          j ← 0
          FÜR k ← von BIS bis
            WENN rechts leer ODER                     @@vergleich
                (links nicht leer UND links[i] ≤ rechts[j]) DANN
              a[k] ← links[i]                          @@schreibeLinks
              i ← i + 1
            SONST
              a[k] ← rechts[j]                         @@schreibeRechts
              j ← j + 1
            ENDE WENN
          ENDE FÜR
        ENDE PROZEDUR
      `,
      csharp: `
        void MergeSort(int[] a, int von, int bis)
        {
            if (von < bis)                             @@teile
            {
                int mitte = (von + bis) / 2;
                MergeSort(a, von, mitte);               @@rekursionLinks
                MergeSort(a, mitte + 1, bis);            @@rekursionRechts
                Verschmelze(a, von, mitte, bis);         @@verschmelzeStart
            }
        }

        void Verschmelze(int[] a, int von, int mitte, int bis)
        {
            int[] links = a[von..(mitte + 1)];
            int[] rechts = a[(mitte + 1)..(bis + 1)];
            int i = 0, j = 0;

            for (int k = von; k <= bis; k++)
            {
                bool nimmLinks = j >= rechts.Length ||   @@vergleich
                    (i < links.Length && links[i] <= rechts[j]);

                if (nimmLinks)
                {
                    a[k] = links[i];                     @@schreibeLinks
                    i++;
                }
                else
                {
                    a[k] = rechts[j];                     @@schreibeRechts
                    j++;
                }
            }
        }
      `,
      javascript: `
        function mergeSort(a, von, bis) {
          if (von < bis) {                              @@teile
            const mitte = Math.floor((von + bis) / 2);
            mergeSort(a, von, mitte);                    @@rekursionLinks
            mergeSort(a, mitte + 1, bis);                @@rekursionRechts
            verschmelze(a, von, mitte, bis);              @@verschmelzeStart
          }
        }

        function verschmelze(a, von, mitte, bis) {
          const links = a.slice(von, mitte + 1);
          const rechts = a.slice(mitte + 1, bis + 1);
          let i = 0, j = 0;

          for (let k = von; k <= bis; k++) {
            const nimmLinks = j >= rechts.length ||       @@vergleich
              (i < links.length && links[i] <= rechts[j]);

            if (nimmLinks) {
              a[k] = links[i];                             @@schreibeLinks
              i++;
            } else {
              a[k] = rechts[j];                             @@schreibeRechts
              j++;
            }
          }
        }
      `
    },

    sortiere: function* (a) {
      yield* teileUndSortiere(a, 0, a.length - 1);
    }
  });

  /** Teilt [von, bis] in der Mitte, sortiert beide Hälften und verschmilzt sie. */
  function* teileUndSortiere(a, von, bis) {
    if (von >= bis) return; // 0 oder 1 Element: schon sortiert, nichts zu zeigen

    const mitte = Math.floor((von + bis) / 2);
    yield {
      typ: "markieren",
      zeile: "teile",
      bereich: { von, bis, text: "wird geteilt" },
      variablen: { von, bis, mitte },
      text: `Teile den Bereich ${von}–${bis} bei der Mitte (Position ${mitte}) in zwei Hälften.`
    };

    yield* teileUndSortiere(a, von, mitte);
    yield* teileUndSortiere(a, mitte + 1, bis);
    yield* verschmelze(a, von, mitte, bis);
  }

  /** Führt die zwei sortierten Hälften [von, mitte] und [mitte+1, bis] zusammen. */
  function* verschmelze(a, von, mitte, bis) {
    const links = a.slice(von, mitte + 1);
    const rechts = a.slice(mitte + 1, bis + 1);
    const bereich = { von, bis, text: "wird verschmolzen" };
    let i = 0;
    let j = 0;

    yield {
      typ: "markieren",
      gemerkt: indexbereich(von, bis),
      zeile: "verschmelzeStart",
      bereich,
      variablen: { von, mitte, bis, i, j },
      text: `Verschmelze die zwei sortierten Hälften ${von}–${mitte} und ${mitte + 1}–${bis}.`
    };

    for (let k = von; k <= bis; k++) {
      const linksVerfuegbar = i < links.length;
      const rechtsVerfuegbar = j < rechts.length;
      const nimmLinks = linksVerfuegbar && (!rechtsVerfuegbar || links[i] <= rechts[j]);

      if (linksVerfuegbar && rechtsVerfuegbar) {
        yield {
          typ: "vergleich",
          indizes: [von + i, mitte + 1 + j],
          zeiger: { i: von + i, j: mitte + 1 + j },
          zeile: "vergleich",
          bereich,
          variablen: { von, mitte, bis, i, j, k },
          text: `${links[i]} und ${rechts[j]} vergleichen: das kleinere kommt jetzt an Position ${k}.`
        };
      }

      if (nimmLinks) {
        a[k] = links[i];
        yield {
          typ: "tausch",
          indizes: [k],
          zeiger: { k },
          zeile: "schreibeLinks",
          bereich,
          variablen: { von, mitte, bis, i, j, k },
          text: rechtsVerfuegbar
            ? `${links[i]} ist kleiner oder gleich – wird an Position ${k} geschrieben.`
            : `Die rechte Hälfte ist aufgebraucht: ${links[i]} wird an Position ${k} geschrieben.`
        };
        i++;
      } else {
        a[k] = rechts[j];
        yield {
          typ: "tausch",
          indizes: [k],
          zeiger: { k },
          zeile: "schreibeRechts",
          bereich,
          variablen: { von, mitte, bis, i, j, k },
          text: linksVerfuegbar
            ? `${rechts[j]} ist kleiner – wird an Position ${k} geschrieben.`
            : `Die linke Hälfte ist aufgebraucht: ${rechts[j]} wird an Position ${k} geschrieben.`
        };
        j++;
      }
    }

    // Nur die äußerste Verschmelzung (der ganze Bereich) ist wirklich endgültig.
    if (von === 0 && bis === a.length - 1) {
      yield {
        typ: "platziert",
        platziert: indexbereich(von, bis),
        zeile: "verschmelzeStart",
        variablen: { von, mitte, bis },
        text: "Der gesamte Bereich ist jetzt sortiert."
      };
    }
  }
})(window.TRACE.sortieren);
