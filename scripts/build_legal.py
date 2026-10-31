"""Render the legal notice only after the operator supplies their identifying details."""
from pathlib import Path
from html import escape
import json
from icons import arrow_svg

ROOT=Path(__file__).resolve().parents[1]

def legal_ready(data):
    return bool(data.get('operator') and data.get('address_lines') and data.get('email') and data.get('rental_type'))

def render_legal(data):
    assert legal_ready(data), 'Confirmed operator, postal address, email and rental type are required.'
    esc=lambda value:escape(str(value),quote=True)
    address='<br>'.join(esc(line) for line in data['address_lines'])
    optional=''
    if data.get('phone'):
        optional+=f'<p>Telefon: <a href="tel:{esc(data["phone"])}">{esc(data["phone"])}</a></p>'
    fields=[('company_register_number','Firmenbuchnummer'),('company_register_court','Firmenbuchgericht'),('vat_id','UID-Nummer')]
    for key,label in fields:
        if data.get(key):optional+=f'<p>{label}: {esc(data[key])}</p>'
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Impressum – Teichhof Steinparz</title><meta name="description" content="Betreiber- und Kontaktangaben für die Website des Teichhofs in Steinparz.">
<link rel="canonical" href="https://steinparz.com/impressum/"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../style.css?v=11"></head>
<body class="legal-page"><div class="legal-top"><a class="footer-brand" href="/">TEICHHOF <span>STEINPARZ</span></a><a href="/">{arrow_svg('←')} Zur Website</a></div>
<main class="legal-content section"><p class="eyebrow">TEICHHOF STEINPARZ</p><h1>Impressum</h1>
<section><h2>Medieninhaber und Betreiber</h2><p>{esc(data['operator'])}<br>{address}</p></section>
<section><h2>Vermietung</h2><p>Private Vermietung.</p></section>
<section><h2>Kontakt</h2><p>E-Mail: <a href="mailto:{esc(data['email'])}">{esc(data['email'])}</a></p>{optional}</section>
<section><h2>Inhalt der Website</h2><p>Vorstellung des Ferienhauses Teichhof in Steinparz, Niederösterreich, und Informationen zu Aufenthalten. Buchungen erfolgen über das verlinkte Airbnb-Inserat.</p></section>
</main><footer><a href="/">Zurück zum Teichhof</a></footer></body></html>'''

if __name__=='__main__':
    data=json.loads((ROOT/'site/legal.json').read_text())
    if legal_ready(data):
        target=ROOT/'impressum/index.html';target.parent.mkdir(exist_ok=True);target.write_text(render_legal(data));print('Legal notice generated.')
    else:
        print('Legal notice prepared; waiting for confirmed operator details. No incomplete page published.')
