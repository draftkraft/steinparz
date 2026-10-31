# Teichhof Steinparz

Statische, mehrsprachige Website für das Ferienhaus Teichhof in Steinparz, Niederösterreich. Veröffentlicht über GitHub Pages mit der Custom Domain `teichhof.com`.

## Inhalte bearbeiten

Die gemeinsame HTML-Vorlage liegt in `site/template.html`; Texte, Metadaten, Bildbeschreibungen und Fragen/Antworten liegen in `site/locales/{sprache}.json`. Die generierten HTML-Seiten nicht direkt bearbeiten.

Sprachen: Deutsch (`/`), Englisch (`/en/`), Italienisch (`/it/`), Französisch (`/fr/`), Slowenisch (`/sl/`), Ungarisch (`/hu/`), Tschechisch (`/cs/`) und Slowakisch (`/sk/`). Der Sprachumschalter ändert die URL; es gibt keine automatische Weiterleitung anhand der Browsersprache.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python scripts/build_site.py
.venv/bin/python scripts/check_site.py
node --check script.js
```

Danach die generierten HTML-Dateien zusammen mit Vorlage und Übersetzungen committen. GitHub Pages liefert die fertigen Dateien aus; `.nojekyll` verhindert die Verarbeitung der Vorlage durch Jekyll. Das Deployment braucht keine Python-Pakete.

## Lokale Vorschau

```sh
python3 -m http.server 8080
```

http://localhost:8080 öffnen. Die Sprachlinks brauchen einen Server mit diesem Ordner als Root. Direkte `file://`-Vorschauen zeigen die einzelnen Seiten und ihre relativen Assets, unterstützen aber keine absoluten Sprachlinks.

## Suche und Sprachversionen

- Jede Sprache hat eine eigene URL, einen lokalisierten Titel, eine Beschreibung und `lang`-Kennzeichnung.
- Selbstreferenzierende Canonicals, gegenseitige `hreflang`-Links und `x-default` sowie eine mehrsprachige `sitemap.xml`.
- `robots.txt` erlaubt die öffentlichen Seiten und Assets; Vorlage und Buildskripte sind vom Crawling ausgeschlossen.
- JSON-LD beschreibt Website, Sprachseite und Unterkunft (`LodgingBusiness`/`Accommodation`). Keine erfundenen Preise, Straßenadressen, Sterne oder Belegungszahlen; keine Zusage von Google-Rich-Results.
- Bilder haben übersetzte Beschreibungen, feste Abmessungen und verzögertes Laden unterhalb des Einstiegs. Das ursprüngliche Titelmotiv hat WebP-Varianten in 960, 1600 und 2560 Pixel Breite.
- Sitemap nach Domain-Verifizierung in Google Search Console unter `https://teichhof.com/sitemap.xml` einreichen. Indexierung und Rankings hängen von Suchmaschinen ab.
- HTTPS muss auf der Domain ein gültiges Zertifikat ausliefern, bevor HTTPS-Canonicals von Suchmaschinen zuverlässig abgerufen werden können.

## Gestaltung

Bildschirmfüllende Natur-, Garten-, Winter- und Buchungsabschnitte; geteilte Bildkapitel; mobile Vollbildnavigation. Die Galerie zeigt alle Motive in einer vertikalen Bildfolge ohne seitliches Scrollen. Einzelbilder öffnen sich in einem Dialog mit Pfeiltastensteuerung, Escape, Fokus-Rückgabe und Bildzähler. Animationen respektieren reduzierte Bewegung; das Scrollen bleibt nativ.

## Quellen und bestätigte Angaben

Originalfotos aus dem vom Betreiber bereitgestellten Bildordner sowie dem [Airbnb-Inserat](https://www.airbnb.de/rooms/1211640025110560668). Die publizierten WebP-Dateien enthalten keine übernommenen EXIF-Metadaten. Das ursprüngliche Startmotiv bleibt erhalten; Steg und Abendhaus haben eigene Aufnahmen.

Betreiberangaben: sieben Zimmer, fünf Doppelbetten, zwei Einzelbetten, Ruderboot und Tierwelt. Drei Badezimmer laut Inserat. Die buchbare Gästezahl, Preise und Hausregeln stehen weiterhin auf Airbnb. Tierbeobachtungen werden nicht zugesichert.

Gästestimmen: kurze Originalauszüge von Kath (August 2026), Lara (August 2026) und Anja Teresa (Juni 2026). Ergänzende Beschreibungen sind sinngemäße Zusammenfassungen. Auf anderen Sprachseiten sind die Auszüge als Übersetzungen aus dem Deutschen gekennzeichnet.

Keine Tracking-Skripte, extern geladenen Schriften oder eingebetteten Karten. Betreiberangaben für Impressum und Datenschutz wurden nicht erfunden und müssen vom Betreiber ergänzt werden.
