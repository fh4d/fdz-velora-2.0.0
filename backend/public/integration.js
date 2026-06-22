(function () {
  'use strict';

  var API_BASE = '/api';
  var IS_DEV   = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  function log(msg) {
    if (IS_DEV) console.log('[FDZ]', msg);
  }

  // ─── Inline status message ────────────────────────────────────────────────────

  function showMessage(form, text, isError) {
    var prev = form.querySelector('.fdz-msg');
    if (prev) prev.parentNode.removeChild(prev);

    var msg = document.createElement('p');
    msg.className   = 'fdz-msg';
    msg.textContent = text;
    msg.setAttribute('aria-live', 'polite');
    msg.style.cssText = [
      'margin-top:12px',
      'font-size:14px',
      'text-align:center',
      'font-family:inherit',
      isError ? 'color:#ef4444' : 'color:#22c55e',
    ].join(';');
    form.appendChild(msg);
  }

  // ─── Form type detection — 3 layers ──────────────────────────────────────────

  function detectFormType(form) {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';

    // ── Layer 1: pathname ────────────────────────────────────────────────────
    // /contact page → always contact
    if (pathname === '/contact') {
      log('Layer 1 (pathname): contact');
      return 'contact';
    }

    // ── Layer 2: DOM structure ───────────────────────────────────────────────
    var hasTextarea = form.querySelector('textarea') !== null;
    var emailInputs = form.querySelectorAll('input[type="email"]');
    var visibleEmailInputs = Array.prototype.filter.call(emailInputs, function (el) {
      return el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1;
    });

    if (hasTextarea) {
      log('Layer 2 (DOM): textarea present → contact');
      return 'contact';
    }

    if (visibleEmailInputs.length === 1 && !hasTextarea) {
      log('Layer 2 (DOM): single email input, no textarea → newsletter');
      return 'newsletter';
    }

    // ── Layer 3: fallback ────────────────────────────────────────────────────
    log('Layer 3: uncertain — ignoring form');
    return null;
  }

  // ─── Contact handler ──────────────────────────────────────────────────────────

  function handleContact(form) {
    log('Submitting → POST ' + API_BASE + '/contact');

    var nameEl    = form.querySelector('input[name="Name"]');
    var emailEl   = form.querySelector('input[type="email"]');
    var messageEl = form.querySelector('textarea');
    var subjectEl = form.querySelector('input[name="Subject"]');

    var payload = {
      name:    nameEl    ? nameEl.value.trim()    : '',
      email:   emailEl   ? emailEl.value.trim()   : '',
      message: messageEl ? messageEl.value.trim() : '',
    };
    if (subjectEl && subjectEl.value.trim()) {
      payload.subject = subjectEl.value.trim();
    }

    fetch(API_BASE + '/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (result.ok) {
          showMessage(form, 'Message received successfully', false);
          form.reset();
        } else {
          showMessage(form, result.data.error || 'Something went wrong', true);
        }
      })
      .catch(function () {
        showMessage(form, 'Something went wrong. Please try again.', true);
      });
  }

  // ─── Newsletter handler ───────────────────────────────────────────────────────

  function handleNewsletter(form) {
    log('Submitting → POST ' + API_BASE + '/newsletter/subscribe');

    var emailEl = form.querySelector('input[type="email"]');

    fetch(API_BASE + '/newsletter/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: emailEl ? emailEl.value.trim() : '' }),
    })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (result) {
        if (result.status === 201) {
          showMessage(form, 'Subscribed successfully', false);
          form.reset();
        } else if (result.status === 409) {
          showMessage(form, 'Email already subscribed', false);
        } else {
          showMessage(form, result.data.error || 'Something went wrong', true);
        }
      })
      .catch(function () {
        showMessage(form, 'Something went wrong. Please try again.', true);
      });
  }

  // ─── Capture-phase submit interceptor ────────────────────────────────────────

  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      var type = detectFormType(form);

      if (!type) return; // uncertain — do nothing, let Framer handle it

      e.preventDefault();
      e.stopImmediatePropagation();

      if (type === 'contact')    handleContact(form);
      if (type === 'newsletter') handleNewsletter(form);
    },
    true // capture phase — fires before Framer's bubble-phase handler
  );

})();
