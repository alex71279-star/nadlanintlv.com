import { createClient } from 'https://esm.sh/@base44/sdk@0.8.40';

const APP_ID = '6a8427f2fbe193e7355b37b9';
const APP_ORIGIN = 'https://telaviv-lead-flow.base44.app';
const FUNCTION_URL = `${APP_ORIGIN}/api/apps/${APP_ID}/functions/getPublicProperties`;
const WHATSAPP_NUMBER = '972506953766';
const container = document.querySelector('#properties .properties');

if (!container) {
  console.warn('[Base44 properties] Properties container not found; keeping static listings.');
} else {
  const base44 = createClient({ appId: APP_ID });

  const text = (value, fallback = '') => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  const safeUrl = (value) => {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    return /^(https?:\/\/|data:image\/)/i.test(url) ? url : '';
  };

  const photoList = (photos) => {
    if (Array.isArray(photos)) return photos.map(safeUrl).filter(Boolean);
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed)) return parsed.map(safeUrl).filter(Boolean);
      } catch (_) {
        return photos.split(',').map((p) => safeUrl(p.trim())).filter(Boolean);
      }
    }
    return [];
  };

  const formatPrice = (property, lang) => {
    const amount = Number(property.asking_price);
    if (!Number.isFinite(amount)) return lang === 'he' ? 'מחיר לפי בקשה' : 'Price on request';
    const rawCurrency = text(property.currency, 'USD').toUpperCase();
    const currency = rawCurrency === 'NIS' ? 'ILS' : rawCurrency;
    try {
      return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (_) {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  const yesNo = (value, lang) => {
    const positive = value === true || value === 1 || /^(yes|true|כן)$/i.test(String(value || '').trim());
    return positive ? (lang === 'he' ? 'כן' : 'Yes') : (lang === 'he' ? 'לא' : 'No');
  };

  const buildSpecs = (p, lang) => {
    const specs = [];
    if (p.interior_size) specs.push(lang === 'he' ? `${p.interior_size} מ״ר בנוי` : `${p.interior_size} sqm interior`);
    if (p.balcony_size) specs.push(lang === 'he' ? `${p.balcony_size} מ״ר מרפסת` : `${p.balcony_size} sqm balcony`);
    if (p.bedrooms) specs.push(lang === 'he' ? `${p.bedrooms} חדרי שינה` : `${p.bedrooms} bedrooms`);
    if (p.bathrooms) specs.push(lang === 'he' ? `${p.bathrooms} חדרי רחצה` : `${p.bathrooms} bathrooms`);
    if (p.floor !== null && p.floor !== undefined && p.floor !== '') specs.push(lang === 'he' ? `קומה ${p.floor}` : `Floor ${p.floor}`);
    if (p.parking) specs.push(lang === 'he' ? `חניה: ${text(p.parking)}` : `Parking: ${text(p.parking)}`);
    if (p.sea_view) specs.push(lang === 'he' ? `נוף לים: ${yesNo(p.sea_view, lang)}` : `Sea view: ${yesNo(p.sea_view, lang)}`);
    if (p.distance_from_beach) specs.push(lang === 'he' ? `${p.distance_from_beach} מ׳ מהים` : `${p.distance_from_beach} m from beach`);
    return specs.slice(0, 4);
  };

  const createCard = (p, lang) => {
    const article = document.createElement('article');
    article.className = 'property';
    article.dataset.propertyId = text(p.property_id);

    const media = document.createElement('div');
    media.className = 'media';
    const photos = photoList(p.photos);
    if (photos[0]) {
      const img = document.createElement('img');
      img.src = photos[0];
      img.alt = text(p.address, lang === 'he' ? 'נכס בתל אביב' : 'Tel Aviv property');
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      media.classList.add('media-placeholder');
    }

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = text(p.property_type, text(p.neighborhood, lang === 'he' ? 'נכס' : 'Property'));
    media.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'pbody';

    const title = document.createElement('h3');
    title.textContent = text(p.address, text(p.neighborhood, lang === 'he' ? 'נכס בתל אביב' : 'Tel Aviv property'));
    body.appendChild(title);

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = formatPrice(p, lang);
    body.appendChild(price);

    if (p.description) {
      const desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = text(p.description);
      body.appendChild(desc);
    }

    const specs = buildSpecs(p, lang);
    if (specs.length) {
      const specsWrap = document.createElement('div');
      specsWrap.className = 'specs';
      specs.forEach((label) => {
        const spec = document.createElement('div');
        spec.className = 'spec';
        spec.textContent = label;
        specsWrap.appendChild(spec);
      });
      body.appendChild(specsWrap);
    }

    if (photos.length > 1) {
      const gallery = document.createElement('div');
      gallery.className = 'gallery';
      photos.slice(1, 4).forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `${text(p.address, 'Property')} ${i + 2}`;
        img.loading = 'lazy';
        gallery.appendChild(img);
      });
      body.appendChild(gallery);
    }

    const contact = document.createElement('a');
    contact.className = 'btn gold';
    const subject = text(p.address, text(p.property_id, 'Tel Aviv property'));
    const message = lang === 'he'
      ? `היי אלכס, אני מתעניין/ת בנכס ${subject}`
      : `Hi Alex, I am interested in ${subject}`;
    contact.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    contact.textContent = lang === 'he' ? 'פרטים על הנכס' : 'Ask about this property';
    body.appendChild(contact);

    article.append(media, body);
    return article;
  };

  let properties = [];

  const render = () => {
    if (!properties.length) return;
    const lang = document.documentElement.lang === 'he' ? 'he' : 'en';
    const fragment = document.createDocumentFragment();
    properties.forEach((property) => fragment.appendChild(createCard(property, lang)));
    container.replaceChildren(fragment);
  };

  const extractItems = (payload) => {
    const body = payload?.data ?? payload ?? {};
    if (Array.isArray(body?.properties)) return body.properties;
    if (Array.isArray(body?.data?.properties)) return body.data.properties;
    return [];
  };

  const loadViaHttp = async () => {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return extractItems(await response.json());
  };

  const loadViaSdk = async () => {
    const response = await base44.functions.invoke('getPublicProperties', {});
    return extractItems(response);
  };

  const load = async () => {
    try {
      let items = [];
      try {
        items = await loadViaHttp();
      } catch (httpError) {
        console.warn('[Base44 properties] Direct app URL failed; trying SDK fallback.', httpError);
        items = await loadViaSdk();
      }

      if (!items.length) {
        console.warn('[Base44 properties] No public properties returned; keeping static listings.');
        return;
      }

      properties = items.filter((p) => !p.listing_status || String(p.listing_status).toLowerCase() === 'active');
      if (!properties.length) return;
      render();

      const langButton = document.getElementById('langBtn');
      if (langButton) langButton.addEventListener('click', () => setTimeout(render, 0));
    } catch (error) {
      console.error('[Base44 properties] Could not load Base44 listings; keeping static listings.', error);
    }
  };

  load();
}
