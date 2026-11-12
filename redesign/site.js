// Mobile menu
(function () {
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
})();

// Contact form: validates, then opens the visitor's email app with the message filled in
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const error = form.querySelector('.error');
  const done = form.querySelector('.done');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = ['fname', 'email', 'topic', 'message'];
    let firstBad = null;
    required.forEach(id => {
      const el = document.getElementById(id);
      const bad = !el.value.trim() || (el.type === 'email' && !el.checkValidity());
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      error.textContent = 'Please fill in your first name, a valid email, a topic, and a message.';
      error.classList.add('show');
      done.classList.remove('show');
      firstBad.focus();
      return;
    }
    error.classList.remove('show');
    const v = id => document.getElementById(id).value.trim();
    const subject = encodeURIComponent('THHYE: ' + v('topic'));
    const body = encodeURIComponent(
      'Name: ' + v('fname') + ' ' + v('lname') + '\nEmail: ' + v('email') +
      (v('org') ? '\nGroup / organization: ' + v('org') : '') +
      '\nTopic: ' + v('topic') + '\n\n' + v('message')
    );
    window.location.href = 'mailto:thhye.help@gmail.com?subject=' + subject + '&body=' + body;
    done.classList.add('show');
  });
})();
