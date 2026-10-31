"""Render all static language pages. Run: .venv/bin/python scripts/build_site.py"""
from pathlib import Path
import json
import re
import html
from datetime import date
from bs4 import BeautifulSoup
from build_legal import legal_ready, render_legal
from icons import arrow_svg, DIRECTIONS
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://teichhof.com'
LANGUAGES = {'de':'Deutsch','en':'English','it':'Italiano','fr':'Français','sl':'Slovenščina','hu':'Magyar','cs':'Čeština','sk':'Slovenčina'}
OG_LOCALES = {'de':'de_AT','en':'en_GB','it':'it_IT','fr':'fr_FR','sl':'sl_SI','hu':'hu_HU','cs':'cs_CZ','sk':'sk_SK'}

def route(lang):
    return '/' if lang == 'de' else f'/{lang}/'

def make(soup, tag_name, **attrs):
    return soup.new_tag(tag_name, attrs=attrs)

source = (ROOT / 'site/template.html').read_text()
legal_data = json.loads((ROOT/'site/legal.json').read_text())
if legal_ready(legal_data):
    legal_target = ROOT/'impressum/index.html'
    legal_target.parent.mkdir(exist_ok=True)
    legal_target.write_text(render_legal(legal_data))
master_keys = set(json.loads((ROOT / 'site/locales/de.json').read_text())['copy'])
for lang, language in LANGUAGES.items():
    data = json.loads((ROOT / f'site/locales/{lang}.json').read_text())
    assert set(data['copy']) == master_keys, f'Missing translations: {lang}'
    content = re.sub(r'\{\{(t\d+)\}\}', lambda m: html.escape(data['copy'][m[1]], quote=False), source)
    assert '{{' not in content
    soup = BeautifulSoup(content, 'html.parser')
    soup.html['lang'] = lang
    path = route(lang)
    url = BASE + path
    soup.title.string = data['title']
    soup.find('meta', attrs={'name':'description'})['content'] = data['description']
    soup.select_one('link[rel="canonical"]')['href'] = url
    soup.select_one('[property="og:title"]')['content'] = data['title']
    soup.select_one('[property="og:description"]')['content'] = data['description']
    for property, value in [('og:url',url),('og:type','website'),('og:site_name','Teichhof'),('og:locale',OG_LOCALES[lang])]:
        soup.head.append(make(soup, 'meta', property=property, content=value))
    for other in LANGUAGES:
        soup.head.append(make(soup,'link',rel='alternate',hreflang=other,href=BASE+route(other)))
        if other != lang:
            soup.head.append(make(soup,'meta',property='og:locale:alternate',content=OG_LOCALES[other]))
    soup.head.append(make(soup,'link',rel='alternate',hreflang='x-default',href=BASE+'/'))
    soup.head.append(make(soup,'meta',name='robots',content='index,follow,max-image-preview:large'))
    for name, value in [('twitter:card','summary_large_image'),('twitter:title',data['title']),('twitter:description',data['description']),('twitter:image',BASE+'/assets/teichhof-panorama.jpg')]:
        soup.head.append(make(soup,'meta',name=name,content=value))
    # Localize all image descriptions and gallery controls, not just visible prose.
    images = soup.select('main img')
    assert len(images) == len(data['images']), (lang, len(images))
    for image, alt in zip(images, data['images']):
        image['alt'] = alt
        image['decoding'] = 'async'
    ui = data['ui']
    soup.select_one('.brand')['aria-label'] = ui[2]
    soup.select_one('#main-nav')['aria-label'] = ui[1]
    for i, button in enumerate(soup.select('[data-photo]'),1):
        button['aria-label'] = ui[3] + ': ' + button.img['alt']
        button['data-caption'] = button.span.get_text(' ',strip=True).replace('↗','').strip()
        button['class'] = ['gallery-item',f'photo-{i}']
    # Pair the landscape winter photo with a short editorial note, bottom-aligned to the portrait beside it.
    winter_photo = soup.select_one('.photo-3')
    panel = make(soup, 'div', **{'class':'gallery-moment'})
    winter_photo.wrap(panel)
    text = make(soup, 'div', **{'class':'gallery-moment-copy'})
    eyebrow = make(soup, 'p', **{'class':'eyebrow'})
    eyebrow.string = data['gallery_moment'][0]
    heading = make(soup, 'p', **{'class':'gallery-moment-heading'})
    heading.append(data['gallery_moment'][1])
    heading.append(make(soup, 'br'))
    emphasis = make(soup, 'em')
    emphasis.string = data['gallery_moment'][2]
    heading.append(emphasis)
    text.append(eyebrow)
    text.append(heading)
    panel.insert(0, text)
    # Original spring, autumn and winter photographs complete the year-round chapter.
    seasonal_grid = make(soup, 'div', **{'class':'season-grid'})
    season_files = [('fruehlingsbluete.webp',1536,2048), ('herbst-im-garten.webp',2048,1536), ('winterpanorama.webp',2048,1536)]
    for index, ((filename, width, height), (caption, alt)) in enumerate(zip(season_files, data['season_photos'])):
        button = make(soup, 'button', **{'class':f'gallery-item season-photo season-photo-{index+1}', 'data-photo':'assets/'+filename, 'data-caption':caption, 'aria-label':ui[3]+': '+alt})
        image = make(soup, 'img', src='assets/'+filename, alt=alt, width=str(width), height=str(height), loading='lazy', decoding='async')
        label = make(soup, 'span')
        label.append(caption+' ')
        arrow = make(soup, 'b')
        arrow.string = '↗'
        label.append(arrow)
        button.append(image)
        button.append(label)
        seasonal_grid.append(button)
    panel.insert_after(seasonal_grid)
    nature_category = make(soup, 'p', **{'class':'eyebrow gallery-category'})
    nature_category.string = data['gallery_nature_title']
    nature_grid = make(soup, 'div', **{'class':'nature-grid'})
    nature_files = ['reiher-am-ufer.webp','regenbogen-am-teich.webp','fisch-im-teich.webp','nebel-am-teich.webp']
    for filename, (caption, alt) in zip(nature_files, data['nature_photos']):
        button = make(soup, 'button', **{'class':'gallery-item nature-photo', 'data-photo':'assets/'+filename, 'data-caption':caption, 'aria-label':ui[3]+': '+alt})
        image = make(soup, 'img', src='assets/'+filename, alt=alt, width=str(2049 if filename in ['fisch-im-teich.webp','nebel-am-teich.webp'] else 2048), height='1536', loading='lazy', decoding='async')
        label = make(soup, 'span')
        label.append(caption+' ')
        arrow = make(soup, 'b')
        arrow.string = '↗'
        label.append(arrow)
        button.append(image)
        button.append(label)
        nature_grid.append(button)
    seasonal_grid.insert_after(nature_grid)
    nature_grid.insert_before(nature_category)
    # Move the bathroom into the interior group, after the two bedroom photographs.
    bathroom = soup.select_one('.photo-2').extract()
    soup.select_one('.photo-5').insert_after(bathroom)
    category = make(soup, 'p', **{'class':'eyebrow gallery-category'})
    category.string = data['gallery_interior_title']
    soup.select_one('.photo-4').insert_before(category)
    dialog = soup.dialog
    dialog['aria-label'] = data['copy']['t003']
    dialog.select_one('.close')['aria-label'] = ui[6]
    dialog.select_one('.photo-prev')['aria-label'] = ui[4]
    dialog.select_one('.photo-next')['aria-label'] = ui[5]
    # Crawlable language links plus a compact native switcher; never redirect by browser language.
    label = make(soup,'label',**{'class':'language-label'})
    hidden = make(soup,'span',**{'class':'sr-only'})
    hidden.string = ui[0]
    label.append(hidden)
    select = make(soup,'select',**{'class':'language-select','aria-label':ui[0]})
    for code, native in LANGUAGES.items():
        option = make(soup,'option',value=route(code),lang=code)
        option.string = code.upper() + ' · ' + native
        if code == lang: option['selected'] = ''
        select.append(option)
    current_language = make(soup, 'span', **{'class':'language-current','aria-hidden':'true'})
    current_language.string = lang.upper()
    label.append(current_language)
    label.append(BeautifulSoup(arrow_svg('↓'), 'html.parser').svg)
    label.append(select)
    soup.select_one('.menu-toggle').insert_before(label)
    nav = make(soup,'nav',**{'class':'language-links','aria-label':ui[0]})
    for code,native in LANGUAGES.items():
        link = make(soup,'a',href=route(code),hreflang=code,lang=code)
        link.string = native
        if code == lang: link['aria-current'] = 'page'
        nav.append(link)
    footer_bottom = make(soup, 'div', **{'class':'footer-bottom'})
    footer_bottom.append(nav)
    soup.footer.append(footer_bottom)
    if legal_ready(legal_data):
        legal_link = make(soup, 'a', href='/impressum/', **{'class':'footer-legal'})
        legal_link.string = data['legal_label']
        footer_bottom.append(legal_link)
    # Helpful visible answers, with no promises about eligibility for search result enhancements.
    faq = make(soup,'section',id='fragen',**{'class':'faq section','aria-labelledby':'faq-title'})
    heading = make(soup,'h2',id='faq-title');heading.string=ui[7];faq.append(heading)
    for question,answer in data['faq']:
        details=make(soup,'details');summary=make(soup,'summary');summary.string=question
        paragraph=make(soup,'p');paragraph.string=answer
        details.append(summary);details.append(paragraph);faq.append(details)
    soup.select_one('.booking').insert_before(faq)
    # Stable entity ID across languages. No invented street address, prices, ratings or capacity.
    images = soup.select('main img')
    schema={'@context':'https://schema.org','@graph':[
        {'@type':'WebSite','@id':BASE+'/#website','url':BASE+'/','name':'Teichhof','inLanguage':list(LANGUAGES)},
        {'@type':'LodgingBusiness','@id':BASE+'/#teichhof','name':'Teichhof','url':BASE+'/',
         'description':data['description'],'image':[BASE+'/'+i['src'] for i in images],
         'address':{'@type':'PostalAddress','addressRegion':'Niederösterreich','addressCountry':'AT'},
         'sameAs':['https://www.airbnb.de/rooms/1211640025110560668'],
         'containsPlace':{'@type':'Accommodation','numberOfRooms':7,'numberOfBathroomsTotal':3,
           'bed':[{'@type':'BedDetails','numberOfBeds':5,'typeOfBed':'Double'},{'@type':'BedDetails','numberOfBeds':2,'typeOfBed':'Single'}]}},
        {'@type':'WebPage','@id':url+'#webpage','url':url,'name':data['title'],'description':data['description'],'inLanguage':lang,
         'isPartOf':{'@id':BASE+'/#website'},'about':{'@id':BASE+'/#teichhof'}}]}
    tag=make(soup,'script',type='application/ld+json');tag.string=json.dumps(schema,ensure_ascii=False).replace('</','<\\/');soup.head.append(tag)
    # Draw arrows as vectors rather than text characters, which iOS can render as emoji.
    for node in list(soup.body.find_all(string=True)):
        if node.parent.name in ('script', 'style'):
            continue
        if any(character in str(node) for character in DIRECTIONS):
            for part in re.split(r'([↗↘↓←→])', str(node)):
                if not part:
                    continue
                if part in DIRECTIONS:
                    node.insert_before(BeautifulSoup(arrow_svg(part), 'html.parser').svg)
                else:
                    node.insert_before(part)
            node.extract()
    # Ensure assets and lightbox images resolve from every language directory, including file previews.
    prefix = '' if lang=='de' else '../'
    for tag in soup.find_all(True):
        if tag.has_attr('srcset'):
            tag['srcset'] = ', '.join(prefix + item.strip() for item in tag['srcset'].split(','))
        for attr in ['src','href','data-photo']:
            value=tag.get(attr,'')
            if value.startswith(('assets/','style.css','script.js')):tag[attr]=prefix+value
    target=ROOT/'index.html' if lang=='de' else ROOT/lang/'index.html'
    target.parent.mkdir(exist_ok=True)
    target.write_text(str(soup)+'\n')

ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
ET.register_namespace('xhtml','http://www.w3.org/1999/xhtml')
ns='http://www.sitemaps.org/schemas/sitemap/0.9'
sitemap=ET.Element(f'{{{ns}}}urlset')
for lang in LANGUAGES:
    entry=ET.SubElement(sitemap,f'{{{ns}}}url')
    ET.SubElement(entry,f'{{{ns}}}loc').text=BASE+route(lang)
    ET.SubElement(entry,f'{{{ns}}}lastmod').text=date.today().isoformat()
    for other in [*LANGUAGES,'x-default']:
        ET.SubElement(entry,'{http://www.w3.org/1999/xhtml}link',rel='alternate',hreflang=other,href=BASE+route('de' if other=='x-default' else other))
ET.indent(sitemap)
ET.ElementTree(sitemap).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /site/\nDisallow: /scripts/\nSitemap: '+BASE+'/sitemap.xml\n')
(ROOT/'.nojekyll').touch()
print(f'Rendered {len(LANGUAGES)} complete language pages and sitemap.')
