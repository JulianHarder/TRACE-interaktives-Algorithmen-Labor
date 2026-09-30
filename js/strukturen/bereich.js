/**
 * Strukturen-Bereich
 * ------------------
 * Anders als Sortieren, Suchen und Wegfindung ist "Strukturen" kein Bereich
 * mit einem Algorithmus-Wähler, sondern drei eigenständige kleine Werkzeuge
 * (Stapel, Warteschlange, Suchbaum) mit unterschiedlichem Aufbau. Dieser
 * Bereich schaltet nur zwischen ihnen um und reicht Tastatur-Ereignisse und
 * "Bereich verlassen" an den gerade sichtbaren Unterbereich weiter. Jeder
 * Unterbereich wird erst beim ersten Anzeigen erzeugt.
 */
window.TRACE = window.TRACE || {};
window.TRACE.strukturen = window.TRACE.strukturen || {};

(function (TRACE, strukturen) {
  "use strict";

  class StrukturenBereich {
    /** @param {HTMLElement} wurzel die <section> des Bereichs */
    constructor(wurzel) {
      this.wurzel = wurzel;
      this.auswahl = wurzel.querySelector("#strukturen-auswahl");
      this.panels = wurzel.querySelectorAll("[data-struktur-panel]");

      this.unterbereiche = {
        stapel: null,
        warteschlange: null,
        suchbaum: null
      };
      this.erzeuger = {
        stapel: (panel) => new strukturen.KetteBereich(panel, strukturen.stapelKonfiguration),
        warteschlange: (panel) => new strukturen.KetteBereich(panel, strukturen.warteschlangeKonfiguration),
        suchbaum: (panel) => new strukturen.SuchbaumBereich(panel)
      };

      this.aktiv = null;
      this.aktiveId = null;

      for (const knopf of this.auswahl.children) {
        knopf.addEventListener("click", () => this._waehle(knopf.dataset.struktur));
      }
      this._waehle("stapel");
    }

    anhalten() {
      if (this.aktiv) this.aktiv.anhalten();
    }

    taste(ereignis) {
      return this.aktiv ? this.aktiv.taste(ereignis) : false;
    }

    _waehle(id) {
      if (this.aktiv) this.aktiv.anhalten();

      for (const knopf of this.auswahl.children) {
        knopf.setAttribute("aria-pressed", String(knopf.dataset.struktur === id));
      }
      for (const panel of this.panels) {
        panel.hidden = panel.dataset.strukturPanel !== id;
      }

      if (!this.unterbereiche[id]) {
        const panel = this.wurzel.querySelector(`[data-struktur-panel="${id}"]`);
        this.unterbereiche[id] = this.erzeuger[id](panel);
      }
      this.aktiv = this.unterbereiche[id];
      this.aktiveId = id;
    }
  }

  strukturen.StrukturenBereich = StrukturenBereich;
})(window.TRACE, window.TRACE.strukturen);
