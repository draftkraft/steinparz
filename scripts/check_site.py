"""Check generated language pages and SEO links without network or browser dependencies."""
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
import json
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
langs = ['de','en','it','fr','sl','hu','cs','sk']
urls = {lang:'https://steinparz.com/' + ('' if lang == 'de' else lang + '/') for lang in langs}
for lang in langs:
    path = ROOT/'index.html' if lang=='de' else ROOT/lang/'index.html'
    content = path.read_text()
    page = BeautifulSoup(content,'html.parser')
    assert page.html['lang']==lang
    assert '{{' not in content
    assert len(page.select('h1'))==1
    assert page.select_one('link[rel="canonical"]')['href']==urls[lang]
    alternatives={tag['hreflang']:tag['href'] for tag in page.select('link[rel="alternate"][hreflang]')}
    assert alternatives == {**urls,'x-default':urls['de']}
    assert page.select_one('meta[name="robots"]')['content'].startswith('index,follow')
    assert page.select_one('meta[name="description"]')['content']
    assert len(page.select('.faq details'))==4
    assert len(page.select('[data-photo]'))==6
    assert not page.select('.gallery-tools,.strip-prev,.strip-next')
    for image in page.select('main img'):
        assert image.get('alt') and int(image['width'])>0 and int(image['height'])>0
    for tag in page.find_all(True):
        for attr in ['src','href','data-photo']:
            value=tag.get(attr,'')
            parts=urlsplit(value)
            if not value or parts.scheme or parts.netloc:continue
            if value.startswith('#'):
                assert value=='#' or page.find(id=value[1:]), (lang,value)
            else:
                target=ROOT/parts.path.lstrip('/') if value.startswith('/') else path.parent/parts.path
                assert target.exists(), (lang,value)
        if tag.has_attr('srcset'):
            for item in tag['srcset'].split(','):
                assert (path.parent/item.strip().split()[0]).exists()
    schema=json.loads(page.select_one('script[type="application/ld+json"]').string)
    assert schema['@graph'][1]['@id']=='https://steinparz.com/#teichhof'
    accommodation=schema['@graph'][1]['containsPlace']
    assert accommodation['numberOfRooms']==7
    assert [bed['numberOfBeds'] for bed in accommodation['bed']]==[5,2]
    # No German source strings should leak into other language versions.
    if lang!='de':
        for node in page.body.find_all(string=True):
            assert 'Gästestimmen' not in str(node) and 'Buchung und Kontakt direkt' not in str(node)
    print(f'{lang}: content, metadata, schema, links and responsive assets OK')
root=ET.parse(ROOT/'sitemap.xml').getroot()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
assert {x.text for x in root.findall('s:url/s:loc',ns)}==set(urls.values())
assert len({BeautifulSoup((ROOT/('index.html' if l=='de' else l+'/index.html')).read_text(),'html.parser').title.string for l in langs})==len(langs)
assert (ROOT/'.nojekyll').exists()
print('Sitemap and all reciprocal language references OK.')
