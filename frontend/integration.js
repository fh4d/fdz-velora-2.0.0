(function () {
  'use strict';

  // ─── API base URL ────────────────────────────────────────────────────────────
  // Local dev  → Express runs on 4000, same machine, relative path works.
  // Production → fetch must cross origins (Vercel → Railway).
  //              Replace the Railway URL below before deploying.
  var API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:4000/api'
    : 'https://fdz-velora-200-production.up.railway.app/api';

  var IS_DEV = window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';

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

    // Layer 1: pathname
    if (pathname === '/contact') {
      log('Layer 1 (pathname): contact');
      return 'contact';
    }

    // Layer 2: DOM structure
    var hasTextarea = form.querySelector('textarea') !== null;
    var visibleEmails = Array.prototype.filter.call(
      form.querySelectorAll('input[type="email"]'),
      function (el) {
        return el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1;
      }
    );

    if (hasTextarea) {
      log('Layer 2 (DOM): textarea → contact');
      return 'contact';
    }

    if (visibleEmails.length === 1) {
      log('Layer 2 (DOM): single email input → newsletter');
      return 'newsletter';
    }

    // Layer 3: fallback — do nothing
    log('Layer 3: uncertain — ignoring');
    return null;
  }

  // ─── Contact handler ──────────────────────────────────────────────────────────

  function handleContact(form) {
    log('POST ' + API_BASE + '/contact');

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
    log('POST ' + API_BASE + '/newsletter/subscribe');

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

  // ─── Blog: inject MongoDB posts on /blog ─────────────────────────────────────

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function buildCard(post) {
    var href = '/blog/' + post.slug;
    var date = formatDate(post.createdAt);
    var img  = post.coverImage
      ? '<img src="' + post.coverImage + '" alt="" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;">'
      : '<div style="width:100%;height:100%;background:var(--token-ba7a9dfd-3e1d-4dea-a25f-9a0d49d43ddf,#fafafa);"></div>';

    var a = document.createElement('a');
    a.className = 'framer-1qp255k framer-dhua5q';
    a.href      = href;
    a.innerHTML =
      '<div class="framer-9a40j0-container">' +
        '<div class="framer-ljj9C framer-HhvlY framer-duqYB framer-r9o1x2 framer-v-srbsb0" style="background-color:var(--token-ba7a9dfd-3e1d-4dea-a25f-9a0d49d43ddf,#fafafa);width:100%;border-radius:8px;opacity:1;">' +
          '<div class="framer-gnth2x" style="border-bottom-left-radius:8px;border-top-left-radius:8px;opacity:1;">' +
            '<div class="framer-1a7h2da" style="transform:none;opacity:1;">' +
              '<div data-framer-background-image-wrapper="true" style="position:absolute;border-radius:inherit;inset:0px;">' + img + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="framer-wvjvpc" style="opacity:1;">' +
            '<div class="framer-1gxk1zs" data-framer-component-type="RichTextContainer" style="transform:none;opacity:1;">' +
              '<p class="framer-text framer-styles-preset-e15wf0">' + post.title + '</p>' +
            '</div>' +
            '<div class="framer-psfemt" style="opacity:1;">' +
              '<div class="framer-1igna9y" data-framer-component-type="RichTextContainer" style="transform:none;opacity:1;">' +
                '<p class="framer-text framer-styles-preset-hod69l">' + date + '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    return a;
  }

  function injectMongoBlogPosts() {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname !== '/blog') return;

    fetch(API_BASE + '/blog')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data || result.data.length === 0) return;

        // Find the container holding the existing blog cards
        var container = document.querySelector('.framer-1ur6je4');
        if (!container) return;

        // Remove previously injected cards before re-injecting
        var existing = container.querySelectorAll('.fdz-mongo-card');
        existing.forEach(function (el) { el.parentNode.removeChild(el); });

        result.data.forEach(function (post) {
          var card = buildCard(post);
          card.classList.add('fdz-mongo-card');
          container.appendChild(card);
        });
        log('Injected ' + result.data.length + ' MongoDB blog post(s)');
      })
      .catch(function () {
        log('Blog fetch failed — skipping injection');
      });
  }

  // Run on initial load and on every client-side navigation Framer performs
  window.addEventListener('load', injectMongoBlogPosts);

  // Framer's router uses history.pushState — intercept it to re-run on navigation
  var _pushState = history.pushState.bind(history);
  history.pushState = function () {
    _pushState.apply(history, arguments);
    setTimeout(injectMongoBlogPosts, 300);
  };
  window.addEventListener('popstate', function () {
    setTimeout(injectMongoBlogPosts, 300);
  });

  // ─── Capture-phase submit interceptor ────────────────────────────────────────

  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      var type = detectFormType(form);
      if (!type) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (type === 'contact')    handleContact(form);
      if (type === 'newsletter') handleNewsletter(form);
    },
    true
  );

})();
