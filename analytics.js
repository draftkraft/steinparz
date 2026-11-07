/* Basic consent mode: no Google requests or events before an explicit opt-in. */
(() => {
  const id = document.querySelector('meta[name="ga-measurement-id"]')?.content;
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;
  const container = document.querySelector('meta[name="gtm-container-id"]')?.content;
  const language = document.documentElement.lang || 'de';
  const messages = {
    de: ['Besuchsstatistik', 'Mit deiner Zustimmung verwenden wir Google Analytics, um Seitenaufrufe und Aktionen wie Buchungsklicks, Galerie und Navigation zu verstehen. Dabei werden Cookies und Geräteinformationen verarbeitet. Die Datenverarbeitung erfolgt durch Google, gegebenenfalls auch in den USA. Du kannst deine Auswahl jederzeit unten über „Analytics“ ändern.', 'Zustimmen', 'Ablehnen', 'Google-Datenschutz'],
    en: ['Visitor analytics', 'With your permission, we use Google Analytics to understand page views and actions such as booking clicks, gallery use and navigation. Cookies and device information are processed by Google, potentially in the USA. Change your choice anytime via “Analytics” below.', 'Accept', 'Decline', 'Google privacy'],
    it: ['Statistiche delle visite', 'Con il tuo consenso utilizziamo Google Analytics per analizzare visite, clic di prenotazione, galleria e navigazione. Google tratta cookie e informazioni sul dispositivo, anche negli USA. Puoi modificare la scelta in qualsiasi momento tramite “Analytics” in basso.', 'Accetta', 'Rifiuta', 'Privacy Google'],
    fr: ['Statistiques de visite', 'Avec votre accord, Google Analytics mesure les visites, clics de réservation, la galerie et la navigation. Google traite des cookies et informations sur votre appareil, éventuellement aux États-Unis. Modifiez votre choix à tout moment via « Analytics » en bas de page.', 'Accepter', 'Refuser', 'Confidentialité Google'],
    sl: ['Statistika obiskov', 'Z vašim soglasjem Google Analytics meri obiske, klike za rezervacije, galerijo in navigacijo. Google obdeluje piškotke in podatke o napravi, lahko tudi v ZDA. Izbiro lahko kadar koli spremenite prek možnosti »Analytics« na dnu strani.', 'Sprejmi', 'Zavrni', 'Zasebnost Google'],
    hu: ['Látogatási statisztikák', 'Hozzájárulásoddal a Google Analytics méri az oldalmegtekintéseket, foglalási kattintásokat, a galéria használatát és a navigációt. A Google sütiket és eszközadatokat kezel, esetleg az USA-ban is. A döntésedet bármikor módosíthatod az oldal alján az „Analytics” gombbal.', 'Elfogadom', 'Elutasítom', 'Google adatvédelem'],
    cs: ['Statistiky návštěv', 'S vaším souhlasem Google Analytics měří návštěvy, kliknutí na rezervaci, galerii a navigaci. Google zpracovává cookies a údaje o zařízení, případně i v USA. Volbu můžete kdykoli změnit pomocí „Analytics“ v zápatí.', 'Přijmout', 'Odmítnout', 'Soukromí Google'],
    sk: ['Štatistiky návštev', 'S vaším súhlasom Google Analytics meria návštevy, kliknutia na rezerváciu, galériu a navigáciu. Google spracúva cookies a údaje o zariadení, prípadne aj v USA. Voľbu môžete kedykoľvek zmeniť cez „Analytics“ v päte.', 'Prijať', 'Odmietnuť', 'Súkromie Google'],
  };
  const copy = messages[language] || messages.en;
  const key = 'teichhof-analytics-consent-v1';
  let choice = null;
  try { choice = localStorage.getItem(key); } catch (_) { /* Ask each visit if storage is unavailable. */ }
  let started = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  function start() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (started) return;
    started = true;
    gtag('js', new Date());
    gtag('config', id, {
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer ? new URL(document.referrer).origin : '',
      allow_google_signals: false, allow_ad_personalization_signals: false,
      language,
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.append(tag);
    // The Google tag container (for Google Ads) loads only after opt-in, under the same default-denied consent state.
    if (/^GTM-[A-Z0-9]+$/.test(container || '')) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const manager = document.createElement('script');
      manager.async = true;
      manager.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(container);
      document.head.append(manager);
    }
  }
  function track(name, data = {}) {
    if (choice !== 'granted') return;
    gtag('event', name, { ...data, page_language: language, transport_type: 'beacon' });
  }
  const panel = document.createElement('section');
  panel.className = 'analytics-consent';
  panel.setAttribute('aria-labelledby', 'analytics-title');
  panel.hidden = true;
  const title = document.createElement('h2'); title.id = 'analytics-title'; title.textContent = copy[0];
  const description = document.createElement('p'); description.textContent = copy[1];
  const privacy = document.createElement('a'); privacy.href = 'https://policies.google.com/privacy'; privacy.textContent = copy[4]; privacy.target = '_blank'; privacy.rel = 'noopener';
  const actions = document.createElement('div');
  const accept = document.createElement('button'); accept.textContent = copy[2];
  const decline = document.createElement('button'); decline.textContent = copy[3];
  actions.append(accept, decline); panel.append(title, description, privacy, actions); document.body.append(panel);
  const settings = document.createElement('button'); settings.className = 'analytics-settings'; settings.textContent = 'Analytics';
  (document.querySelector('footer .footer-bottom') || document.querySelector('footer') || document.body).append(settings);
  settings.addEventListener('click', () => { panel.hidden = false; accept.focus(); });
  function choose(value) {
    const withdrawing = choice === 'granted' && value === 'denied';
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) { /* Consent still applies to this page. */ }
    panel.hidden = true;
    if (value === 'granted') start();
    else {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      // Remove GA cookies at both host and parent-domain scopes when consent is withdrawn.
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) return;
        const domains = location.hostname.split('.');
        document.cookie = `${name}=; Max-Age=0; path=/`;
        for (let i = 0; i < domains.length - 1; i++) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domains.slice(i).join('.')}`;
      });
      if (withdrawing) location.reload();
    }
    settings.focus();
  }
  accept.addEventListener('click', () => choose('granted'));
  decline.addEventListener('click', () => choose('denied'));
  if (choice === 'granted') start();
  else if (choice !== 'denied') panel.hidden = false;

  // Delegation automatically covers future links and buttons, without sending free-form input.
  document.addEventListener('click', event => {
    const control = event.target.closest('a, button');
    if (!control || panel.contains(control) || control === settings) return;
    const section = control.closest('section');
    const position = control.matches('.book-fab') ? 'floating_cta' : section?.id || [...(section?.classList || [])][0] || (control.closest('header') ? 'header' : 'footer');
    const data = { action_location: position, action_name: control.id || [...control.classList][0] || control.tagName.toLowerCase() };
    if (control.matches('[data-photo]')) {
      track('gallery_open', { ...data, image_name: control.dataset.photo.split('/').pop() });
    } else if (control.matches('a')) {
      const url = new URL(control.href, location.href);
      if (/^(mailto:|tel:)$/.test(url.protocol)) {
        track('contact_click', { ...data, contact_type: url.protocol.slice(0, -1) });
      } else if (url.hostname.endsWith('airbnb.de') || url.hostname.endsWith('airbnb.com')) {
        track(url.hash === '#reviews' ? 'reviews_click' : 'booking_click', { ...data, link_domain: url.hostname });
      } else if (url.origin !== location.origin) {
        track('outbound_click', { ...data, link_domain: url.hostname });
      } else {
        track('navigation_click', { ...data, destination: url.pathname + url.hash });
      }
    } else {
      track(control.matches('.menu-toggle') ? 'menu_toggle' : control.matches('.photo-prev,.photo-next') ? 'gallery_navigate' : 'button_click', {
        ...data, action_name: control.id || [...control.classList][0] || 'button',
        ...(control.matches('.menu-toggle') ? { expanded: control.getAttribute('aria-expanded') } : {}),
      });
    }
  });
  document.addEventListener('change', event => {
    if (event.target.closest('.contact-form')) track('contact_form_change', { action_location: 'kontakt' });
    if (event.target.closest('.ftb-widget')) track('booking_widget_change', { action_location: 'buchen', action_name: 'availability_change' });
    if (event.target.matches('.language-select')) track('language_change', { destination: event.target.value });
  }, true);
  document.addEventListener('submit', event => {
    if (event.target.matches('.contact-form')) track('contact_submit', { action_location: 'kontakt', contact_type: 'form' });
    if (event.target.closest('.ftb-widget')) track('booking_search', { action_location: 'buchen', booking_provider: 'freetobook' });
  }, true);
  document.querySelectorAll('.faq details').forEach((details, index) => {
    details.addEventListener('toggle', () => track('faq_toggle', { question_index: index + 1, expanded: details.open }));
  });
  document.querySelector('dialog')?.addEventListener('close', () => track('gallery_close'));
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) track('gallery_navigate', { action_name: event.key });
  });
  const milestones = new Set();
  let scrollQueued = false;
  addEventListener('scroll', () => {
    if (scrollQueued || choice !== 'granted') return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const height = document.documentElement.scrollHeight - innerHeight;
      if (height <= 0) return;
      const percent = Math.min(100, Math.round(scrollY / height * 100));
      [25, 50, 75, 90].forEach(value => {
        if (percent >= value && !milestones.has(value)) {
          milestones.add(value);
          track('scroll_depth', { percent_scrolled: value });
        }
      });
    });
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && choice === 'granted') {
        const section = entry.target;
        track('section_view', { section_name: section.id || [...section.classList][0] });
        observer.unobserve(section);
      }
    }), { threshold: .25 });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
  }
})();
