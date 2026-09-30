# TRACE: Projektplan

**Name:** TRACE – interaktives Algorithmen-Labor
**Kurzname:** TRACE
**Untertitel:** interaktives Algorithmen-Labor
**Titelzeile im Projekt:** TRACE by Julian Harder
**Namensherkunft:** „Trace“ heißt Spur oder verfolgen. In der Informatik ist ein Trace die Aufzeichnung, was ein Programm Schritt für Schritt tut (z. B. Stack Trace, Trace-Tabelle). Im Deutschen entspricht das dem Schreibtischtest. Genau das macht das Projekt sichtbar. Kurz, in Großbuchstaben, ein echter Fachbegriff, passend zu SOL und HADAL. „Labor“ steht dafür, dass man nicht nur zuschaut, sondern selbst ausprobiert: eigene Zahlen eingeben, Wände zeichnen, Verfahren gegeneinander antreten lassen.

Eine interaktive Webseite, auf der man Algorithmen bei der Arbeit zusieht: Sortieren, Suchen, Wegfindung und Datenstrukturen. Jeder Schritt wird sichtbar gemacht, erklärt und dem passenden Code gegenübergestellt.

---

## 1. Ziele

- **Verstehen:** Algorithmen nicht nur auswendig lernen, sondern sehen, was sie tun und warum manche schneller sind als andere.
- **Prüfungsvorbereitung:** Themen der IHK-Prüfung (Fachinformatiker Anwendungsentwicklung) abdecken, vor allem Sortieren, Suchen, Pseudocode und Schreibtischtest.
- **Portfolio:** Ein Projekt, das in Bewerbungen zeigt, dass ich sauber strukturierten Code schreibe und Informatik-Grundlagen verstehe.

---

## 2. Rahmenbedingungen (festgelegt)

- **Mehrere Dateien** in einer klaren Ordnerstruktur (siehe Abschnitt 9), nicht eine einzige große Datei
- **Offline lauffähig:** `index.html` startet per Doppelklick, ohne Server. Deshalb werden die Skripte als normale `<script>`-Dateien eingebunden, nicht als ES-Module (Module funktionieren beim Öffnen per Doppelklick nicht)
- **Keine externen Bibliotheken:** reines HTML, CSS und JavaScript, gezeichnet mit Canvas oder SVG
- **Kein Ton**
- **Veröffentlichung** über GitHub und GitHub Pages, damit es auch auf dem Firmenlaptop im Browser läuft
- **Umsetzung** mit Claude Code, weil es direkt mit mehreren Dateien arbeiten kann

---

## 3. Aufbau der Seite

Eine Startseite mit Kacheln für die vier Bereiche. Jeder Bereich hat dasselbe Grundlayout, damit man sich sofort zurechtfindet:

```
┌───────────────────────────────────────────────────────────┐
│ TRACE    Sortieren · Suchen · Wegfindung · Strukturen      │
├───────────────────────────────────────┬───────────────────┤
│                                       │ Code              │
│        Visualisierung                 │ (aktuelle Zeile   │
│        (Balken, Gitter, Baum …)       │  markiert)        │
│                                       ├───────────────────┤
│                                       │ Variablen /       │
│                                       │ Schreibtischtest  │
├───────────────────────────────────────┴───────────────────┤
│ Erklärung des aktuellen Schritts                           │
├────────────────────────────────────────────────────────────┤
│ ◀ Schritt   ▶ Start/Pause   Schritt ▶   Tempo ───●──  Neu  │
│ Vergleiche: 42   Vertauschungen: 17   Schritte: 59         │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Die Bereiche

### 4.1 Sortieren

**Muss:**
- Bubble Sort, Selection Sort, Insertion Sort
- Merge Sort und Quicksort
- Zahlen als Balken, Farben zeigen, was gerade passiert (siehe Farbcode in Abschnitt 7)
- Zähler für Vergleiche, Vertauschungen und Schritte
- Eingabe-Varianten: zufällig, bereits sortiert, umgekehrt sortiert, fast sortiert, viele gleiche Werte
- Eigene Zahlen eingeben (z. B. „5, 3, 8, 1, 9“)
- Anzahl der Elemente einstellbar (etwa 5 bis 100)

**Kann:**
- **Wettrennen:** zwei Algorithmen sortieren nebeneinander dieselben Zahlen
- **Vergleichsdiagramm:** wie viele Schritte jeder Algorithmus bei 10, 100, 1.000 Elementen braucht
- Heapsort als Zusatz

| Algorithmus | Laufzeit im Schnitt | Schlimmster Fall | Stabil |
|---|---|---|---|
| Bubble Sort | O(n²) | O(n²) | ja |
| Selection Sort | O(n²) | O(n²) | nein |
| Insertion Sort | O(n²) | O(n²) | ja |
| Merge Sort | O(n log n) | O(n log n) | ja |
| Quicksort | O(n log n) | O(n²) | nein |

Diese Infos stehen bei jedem Algorithmus in einem kleinen Infokasten, jeweils mit einem Satz in einfachen Worten erklärt.

### 4.2 Suchen

**Muss:**
- Lineare Suche und binäre Suche
- Zahlen als Reihe von Kästchen, der aktuell geprüfte Bereich wird hervorgehoben
- Bei der binären Suche sieht man, wie der Suchbereich jedes Mal halbiert wird
- Zähler: Wie viele Vergleiche wurden gebraucht?
- Hinweis, dass die binäre Suche nur bei sortierten Daten funktioniert

**Kann:**
- Direktvergleich bei großen Mengen, z. B. „Finde eine Zahl in 1.000.000 Einträgen“: linear bis zu 1.000.000 Schritte, binär höchstens etwa 20

### 4.3 Wegfindung

**Muss:**
- Gitter, auf dem man mit der Maus Wände zeichnet und Start und Ziel verschiebt
- Breitensuche (BFS), Tiefensuche (DFS), Dijkstra und A*
- Man sieht, welche Felder besucht werden und wie sich die Suche ausbreitet
- Der gefundene Weg wird am Ende hervorgehoben
- Zähler: besuchte Felder und Länge des Wegs

**Kann:**
- Felder mit „Gewicht“ (z. B. Sumpf kostet mehr als Straße), damit man den Unterschied zwischen BFS und Dijkstra sieht
- Zufälliges Labyrinth erzeugen
- Kurzer Bezug zur Praxis: Navi, Netzwerk-Routing, Spielfiguren

**Wichtige Aussagen, die das Projekt vermitteln soll:**
- BFS findet auf ungewichteten Gittern den kürzesten Weg
- DFS findet irgendeinen Weg, aber nicht unbedingt den kürzesten
- Dijkstra findet den kürzesten Weg auch mit Gewichten (solange keine negativ sind)
- A* nutzt eine Schätzung zum Ziel und besucht dadurch meist deutlich weniger Felder

### 4.4 Datenstrukturen

**Muss:**
- **Stapel (Stack):** Push und Pop, Prinzip „zuletzt rein, zuerst raus“ (LIFO)
- **Warteschlange (Queue):** Enqueue und Dequeue, Prinzip „zuerst rein, zuerst raus“ (FIFO)
- **Binärer Suchbaum:** Werte einfügen, suchen und den Weg durch den Baum verfolgen

**Kann:**
- Verkettete Liste
- Baum-Durchläufe (Inorder, Preorder, Postorder)
- Hinweis, warum ein Suchbaum bei sortierten Eingaben zur „Liste“ entartet

---

## 5. Was jeder Algorithmus können muss

Gemeinsame Funktionen, die überall gleich funktionieren:

- **Start / Pause** und **Tempo-Regler**
- **Schritt vor und Schritt zurück**, damit man eine Stelle in Ruhe nachvollziehen kann
- **Erklärung in einem Satz** zu jedem Schritt, z. B. „8 ist größer als 3, also werden sie getauscht“
- **Code-Ansicht** mit markierter aktueller Zeile, umschaltbar zwischen:
  - Pseudocode (wie in der IHK-Prüfung)
  - C#
  - JavaScript
- **Schreibtischtest-Tabelle:** Werte der Variablen (z. B. `i`, `j`, `min`) werden Zeile für Zeile mitgeschrieben, genau wie beim Schreibtischtest auf Papier
- **Infokasten:** Laufzeit, Speicherbedarf, stabil ja/nein, wann man den Algorithmus einsetzt
- **Zurücksetzen und neu mischen**

---

## 6. Steuerung

- Maus bzw. Finger für alle Knöpfe
- Tastatur:
  - Leertaste: Start / Pause
  - Pfeil rechts / links: Schritt vor / zurück
  - R: neu mischen bzw. zurücksetzen
- Auf dem Handy nutzbar, aber für den großen Bildschirm gedacht (wie bei SOL optional ein Hinweis)

---

## 7. Gestaltung

- Aufgeräumt und ruhig, damit der Blick bei der Visualisierung bleibt
- Heller und dunkler Modus, passend zur Systemeinstellung
- Kein Gedrängel: lieber eine Sache gut sichtbar als zehn gleichzeitig
- **Einheitlicher Farbcode in allen Bereichen:**

| Farbe | Bedeutung |
|---|---|
| Neutral (grau) | unberührt |
| Gelb/Bernstein | wird gerade verglichen oder geprüft |
| Orange/Koralle | wird gerade verändert (getauscht, verschoben) |
| Grün/Türkis | fertig bzw. gefunden |
| Blau | aktueller Suchbereich oder Weg |

- Farbe nie als einziges Merkmal: zusätzlich Text oder Markierung, damit es auch bei Farbschwäche verständlich bleibt

---

## 8. Technischer Ansatz

### Trennung von Logik und Darstellung

Das ist der wichtigste Baustein und genau das, was im Portfolio gut aussieht:

- Jeder Algorithmus ist eine **Generator-Funktion** (`function*`), die bei jedem Schritt ein Schritt-Objekt zurückgibt
- Der Algorithmus zeichnet nichts selbst, er beschreibt nur, was passiert
- Eine separate **Darstellungs-Schicht** zeichnet die Schritte
- Ein gemeinsamer **Player** steuert Start, Pause, Tempo und Schritt vor/zurück

Beispiel für ein Schritt-Objekt:

```js
{
  typ: "vergleich",          // oder "tausch", "fertig", "besucht" …
  indizes: [3, 4],           // welche Elemente betroffen sind
  zeile: 5,                  // welche Code-Zeile gerade läuft
  variablen: { i: 2, j: 3 }, // für den Schreibtischtest
  text: "Vergleiche 8 und 3" // Erklärung für den Nutzer
}
```

### Schritt zurück

Alle Schritte werden beim Durchlauf in einer Liste gespeichert. „Zurück“ springt zum vorherigen gespeicherten Zustand.

### Neue Algorithmen hinzufügen

Ein neuer Algorithmus braucht nur eine neue Datei mit seiner Generator-Funktion, seinem Code-Text (Pseudocode, C#, JavaScript) und seinen Infos. Er wird in einer zentralen Liste registriert und taucht automatisch in der Auswahl auf.

---

## 9. Ordnerstruktur

```
trace/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js              Start, Navigation zwischen den Bereichen
│   ├── player.js            Start/Pause, Tempo, Schritt vor/zurück
│   ├── ui/
│   │   ├── codeansicht.js   Code mit markierter Zeile
│   │   └── schreibtisch.js  Schreibtischtest-Tabelle
│   ├── sortieren/
│   │   ├── ansicht.js       Balken zeichnen
│   │   ├── bubble.js
│   │   ├── selection.js
│   │   ├── insertion.js
│   │   ├── merge.js
│   │   └── quick.js
│   ├── suchen/
│   │   ├── ansicht.js
│   │   ├── linear.js
│   │   └── binaer.js
│   ├── wegfindung/
│   │   ├── gitter.js        Gitter zeichnen und bearbeiten
│   │   ├── bfs.js
│   │   ├── dfs.js
│   │   ├── dijkstra.js
│   │   └── astar.js
│   └── strukturen/
│       ├── stapel.js
│       ├── warteschlange.js
│       └── suchbaum.js
└── README.md
```

---

## 10. Umsetzung in Etappen

### Etappe 1: Grundgerüst und einfaches Sortieren
- Ordnerstruktur, Startseite, Navigation
- Player mit Start/Pause, Tempo, Schritt vor/zurück
- Bubble Sort, Selection Sort, Insertion Sort
- Balken-Darstellung mit Farbcode, Zähler, Erklärungstext
- Code-Ansicht mit markierter Zeile (zunächst Pseudocode)

### Etappe 2: Schnelles Sortieren und Vergleich
- Merge Sort und Quicksort
- Eingabe-Varianten und eigene Zahlen
- Code-Ansicht zusätzlich in C# und JavaScript
- Infokasten mit Laufzeiten
- Optional: Wettrennen-Modus

### Etappe 3: Suchen und Schreibtischtest
- Lineare und binäre Suche
- Schreibtischtest-Tabelle für alle bisherigen Algorithmen

### Etappe 4: Wegfindung
- Gitter mit Wänden, Start und Ziel
- BFS, DFS, Dijkstra, A*
- Optional: Gewichte und Labyrinth-Erzeugung

### Etappe 5: Datenstrukturen
- Stapel, Warteschlange, binärer Suchbaum

### Etappe 6: Feinschliff und Veröffentlichung
- Heller und dunkler Modus, Handy-Ansicht
- Tastaturkürzel
- README für GitHub (Beschreibung, Screenshots, was ich dabei gelernt habe)
- Veröffentlichung über GitHub Pages

---

## 11. Leitprinzipien

- Verständlichkeit vor Effekten: Jede Animation soll etwas erklären
- Jede Etappe muss für sich fertig und benutzbar sein
- Sauberer, gut benannter Code, weil der Code selbst Teil des Portfolios ist
- Fachlich korrekt: Laufzeiten und Aussagen lieber einmal mehr prüfen
- Bei Veröffentlichung (z. B. LinkedIn) bescheiden bleiben und die KI-Unterstützung offen nennen
- Den Code verstehen, nicht nur übernehmen: Jeden Algorithmus sollte ich selbst erklären können, denn genau danach kann im Vorstellungsgespräch gefragt werden

---

## 12. Nächster Schritt

Diese Datei in Claude Code (oder einem neuen Chat) geben, zusammen mit der Bitte: „Baue Etappe 1 von TRACE nach diesem Plan.“ Die Datei enthält alle Entscheidungen, sodass nichts erneut besprochen werden muss.
