# Teichhof Steinparz

Responsive deutschsprachige Website für das Ferienhaus Teichhof in Steinparz, Niederösterreich. Statisches HTML, CSS und JavaScript; keine Installation, kein Build und keine externen Laufzeit-Abhängigkeiten.

## Lokal ansehen

```sh
python3 -m http.server 8080
```

Danach http://localhost:8080 öffnen. Alternativ `index.html` direkt im Browser öffnen.

## Inhalt

- Originalbilder, Unterkunftsdaten und Buchungslink aus dem [Airbnb-Inserat](https://www.airbnb.de/rooms/1211640025110560668), abgerufen am 29.10.2026.
- Responsive Darstellung, tastaturbedienbare Fotogalerie, native Dialog-Fokusführung und reduzierte Animation bei entsprechender Systemeinstellung.
- Keine Tracking-Skripte, extern geladenen Schriftarten oder eingebetteten Karten. Airbnb und Google Maps werden erst beim Öffnen der Links aufgerufen.
- Preise und Verfügbarkeit werden direkt auf Airbnb angezeigt.

## Hosting

Den gesamten Ordner als statische Website bereitstellen. Alle Asset-Pfade sind relativ und funktionieren auch unter einem Repository-Unterpfad. Vor einer öffentlichen kommerziellen Veröffentlichung sind die tatsächlichen Betreiberangaben für Impressum und Datenschutz zu ergänzen; diese wurden nicht erfunden.

## Gestaltung und Inhalt (Update)

Bildschirmfüllender Einstieg mit einem 2560 px breiten Originalbild, Bildkapitel zu Natur und Familienzeit, Wintermotiv und eine Galerie mit sechs Bildern. Die Galerie unterstützt Pfeiltasten, Escape, Fokus-Rückgabe und einen Bildzähler. Dezente Einblendungen respektieren reduzierte Bewegung; das Scrollen bleibt nativ.

Zimmerdaten laut Betreiber: sieben Zimmer mit fünf Doppelbetten und zwei Einzelbetten. Die buchbare Belegung wird weiterhin über Airbnb angegeben. Ruderboot und Tierwelt basieren auf Betreiberangaben; Tierbeobachtungen werden nicht zugesichert.

Gästestimmen: kurze Originalauszüge von Kath (August 2026), Lara (August 2026) und Anja Teresa (Juni 2026) aus den im Airbnb-Inserat gelesenen Bewertungen. Ergänzungen sind als sinngemäße Zusammenfassungen gekennzeichnet und zur Quelle verlinkt.

Geprüft: JavaScript-Syntax, lokale Bilddateien, interne Sprungziele, korrigierte Zimmerdaten sowie Desktop-Darstellung und Tastaturbedienung der Galerie in Safari. Mobile Regeln sind implementiert; eine Prüfung auf einem echten Mobilgerät steht aus.
