const ANALYTICS_ENDPOINT = '';
const COOKIE_CONSENT_KEY = 'thhye_cookie_consent';
const VISITOR_COOKIE_NAME = 'thhye_visitor_id';
const viewedSections = new Set();

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax' + secure;
}

function getCookie(name) {
  return document.cookie.split('; ').reduce((found, part) => {
    const [key, value] = part.split('=');
    return key === name ? decodeURIComponent(value || '') : found;
  }, '');
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
}

function hasAnalyticsConsent() {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
}

function getVisitorId() {
  if (!hasAnalyticsConsent()) return null;
  let visitorId = getCookie(VISITOR_COOKIE_NAME);
  if (!visitorId) {
    const randomId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    visitorId = 'thhye_' + randomId;
    setCookie(VISITOR_COOKIE_NAME, visitorId, 365);
  }
  return visitorId;
}

function setCookieConsent(accepted) {
  localStorage.setItem(COOKIE_CONSENT_KEY, accepted ? 'accepted' : 'declined');
  document.getElementById('cookie-banner').classList.remove('active');

  if (window.gtag) {
    gtag('consent', 'update', { analytics_storage: accepted ? 'granted' : 'denied' });
  }

  if (accepted) {
    getVisitorId();
    trackEvent('cookie_consent_accepted');
  } else {
    deleteCookie(VISITOR_COOKIE_NAME);
  }
}

function setupCookieBanner() {
  if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
    document.getElementById('cookie-banner').classList.add('active');
  }
}

function trackEvent(eventName, detail = {}) {
  if (!hasAnalyticsConsent()) return;

  const event = {
    event: eventName,
    visitorId: getVisitorId(),
    path: location.pathname,
    timestamp: new Date().toISOString(),
    ...detail
  };

  const recentEvents = JSON.parse(localStorage.getItem('thhye_recent_events') || '[]');
  recentEvents.push(event);
  localStorage.setItem('thhye_recent_events', JSON.stringify(recentEvents.slice(-50)));

  if (window.gtag) {
    window.gtag('event', eventName, detail);
  }

  if (ANALYTICS_ENDPOINT) {
    const payload = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  }
}

function setupSectionTracking() {
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sectionId = entry.target.id;
      if (viewedSections.has(sectionId)) return;
      viewedSections.add(sectionId);
      trackEvent('section_view', { section: sectionId });
    });
  }, { threshold: 0.45 });

  sections.forEach(section => observer.observe(section));
}

function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('nav-toggle').classList.toggle('open');
}

function closeNav() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('nav-toggle').classList.remove('open');
}

function submitForm() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const topic = document.getElementById('topic').value;
  const message = document.getElementById('message').value.trim();

  if (!fname || !email || !topic || !message) {
    alert('Please fill in all required fields.');
    return;
  }

  const subject = encodeURIComponent('THHYE Contact: ' + topic);
  const body = encodeURIComponent(
    'Name: ' + fname + ' ' + lname + '\n' +
    'Email: ' + email + '\n' +
    'Topic: ' + topic + '\n\n' +
    'Message:\n' + message
  );

  trackEvent('contact_attempt', { topic });
  window.location.href = 'mailto:thhye.help@gmail.com?subject=' + subject + '&body=' + body;

  document.getElementById('confirm-email').textContent = email;
  document.getElementById('success-msg').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  setupCookieBanner();
  setupSectionTracking();
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeNav));
});
