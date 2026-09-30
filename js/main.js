/**
 * Start und Navigation
 * --------------------
 * Die Seite besteht aus mehreren <section>-Elementen, von denen immer nur eines
 * sichtbar ist. Welches, steht im Hash der Adresse (#/sortieren). Das
 * funktioniert auch beim Öffnen per Doppelklick ohne Server.
 */
(function (TRACE) {
  "use strict";

  const seiten = document.querySelectorAll(".seite");
  const navLinks = document.querySelectorAll(".hauptnav a");

  // Bereiche, die schon umgesetzt sind: Hash → { erzeugen, titel }. Jeder Bereich
  // wird erst beim ersten Besuch erzeugt und danach wiederverwendet.
  const BEREICHE = {
    sortieren: {
      titel: "Sortieren",
      erzeugen: (wurzel) => new TRACE.sortieren.SortierBereich(wurzel)
    },
    suchen: {
      titel: "Suchen",
      erzeugen: (wurzel) => new TRACE.suchen.SuchenBereich(wurzel)
    },
    wegfindung: {
      titel: "Wegfindung",
      erzeugen: (wurzel) => new TRACE.wegfindung.WegfindungBereich(wurzel)
    },
    strukturen: {
      titel: "Datenstrukturen",
      erzeugen: (wurzel) => new TRACE.strukturen.StrukturenBereich(wurzel)
    }
  };
  const bereichsInstanzen = {};
  let aktiverBereich = null; // bekommt die Tastatur-Eingaben

  function zeigeRoute() {
    const ziel = location.hash.replace(/^#\/?/, "");
    const seite = BEREICHE[ziel] ? ziel : "start";

    for (const element of seiten) {
      element.hidden = element.dataset.seite !== seite;
    }
    for (const link of navLinks) {
      if (link.dataset.ziel === ziel) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }

    if (aktiverBereich) aktiverBereich.anhalten();
    aktiverBereich = null;

    if (BEREICHE[seite]) {
      if (!bereichsInstanzen[seite]) {
        bereichsInstanzen[seite] = BEREICHE[seite].erzeugen(
          document.querySelector(`[data-seite="${seite}"]`)
        );
      }
      aktiverBereich = bereichsInstanzen[seite];
    }

    document.title = BEREICHE[seite]
      ? `${BEREICHE[seite].titel} · TRACE`
      : "TRACE – interaktives Algorithmen-Labor";
    window.scrollTo(0, 0);
  }

  // Tastatur: Leertaste, Pfeile, R. Nicht, wenn gerade in ein Textfeld getippt wird
  // oder eine Tastenkombination mit Strg/Alt/Cmd gedrückt ist.
  let leertasteAbgefangen = false;

  document.addEventListener("keydown", (ereignis) => {
    if (!aktiverBereich || ereignis.ctrlKey || ereignis.metaKey || ereignis.altKey) return;
    const ziel = ereignis.target;
    if (ziel.isContentEditable || /^(TEXTAREA|SELECT)$/.test(ziel.tagName)) return;
    if (ziel.tagName === "INPUT" && !["range", "button", "checkbox"].includes(ziel.type)) return;

    if (aktiverBereich.taste(ereignis)) {
      ereignis.preventDefault();
      leertasteAbgefangen = ereignis.key === " ";
    }
  });

  // Ein fokussierter Knopf würde bei der Leertaste zusätzlich "geklickt".
  // Das verhindern wir, sonst würde Start/Pause doppelt ausgelöst.
  document.addEventListener("keyup", (ereignis) => {
    if (ereignis.key === " " && leertasteAbgefangen) {
      ereignis.preventDefault();
      leertasteAbgefangen = false;
    }
  });

  window.addEventListener("hashchange", zeigeRoute);
  zeigeRoute();
})(window.TRACE);
