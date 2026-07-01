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

  // ─── Case Studies: inject MongoDB cards on /case-studies ──────────────────────
  // Container: .framer-m0p3pe
  // Card template extracted from the exact Framer HTML in case-studies/index.html.
  // All Framer classes preserved — CSS hover animations work identically.
  // Cards link to /book-a-call; click interceptor below hard-navigates via
  // window.location.href to bypass Framer's SPA router.

  // Inject animation + shimmer CSS once (idempotent)
  (function injectCsStyles() {
    if (document.getElementById('fdz-cs-styles')) return;
    var s = document.createElement('style');
    s.id = 'fdz-cs-styles';
    s.textContent = [
      // Entrance animation — matches Framer's spring (cubic-bezier(0.22,1,0.36,1))
      '@keyframes fdzCsFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
      '.fdz-cs-card{animation:fdzCsFadeUp 0.35s ease-out both}',
      // Stagger delays for up to 8 cards
      '.fdz-cs-card:nth-child(1){animation-delay:0.00s}',
      '.fdz-cs-card:nth-child(2){animation-delay:0.05s}',
      '.fdz-cs-card:nth-child(3){animation-delay:0.10s}',
      '.fdz-cs-card:nth-child(4){animation-delay:0.15s}',
      '.fdz-cs-card:nth-child(5){animation-delay:0.20s}',
      '.fdz-cs-card:nth-child(6){animation-delay:0.25s}',
      '.fdz-cs-card:nth-child(7){animation-delay:0.30s}',
      '.fdz-cs-card:nth-child(8){animation-delay:0.35s}',
      // Shimmer on empty grid container (shows while fetch is in flight)
      '@keyframes fdzShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}',
      '.fdz-cs-loading{min-height:480px;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:fdzShimmer 1.4s ease infinite;border-radius:8px}',
    ].join('');
    document.head.appendChild(s);
  })();

  function buildCaseStudyCard(study) {
    // Exact Framer card HTML structure — preserves all class names so
    // CSS hover animations (arrow, image scale, overlay) work without any JS.
    var img = study.heroImage
      ? '<img src="' + study.heroImage + '" alt="' + (study.title || '').replace(/"/g, '&quot;') + '" loading="lazy" style="display:block;width:100%;height:100%;border-radius:inherit;object-position:center;object-fit:cover;">'
      : '<div style="width:100%;height:100%;background:var(--token-c42c6532-5e43-498f-83ed-eac9f5bec719,rgb(245,245,245));"></div>';

    var logoImg = study.logo
      ? '<img src="' + study.logo + '" alt="" loading="lazy" style="display:block;width:100%;height:100%;object-fit:contain;">'
      : '';

    var stat1Val   = (study.stats && study.stats[0]) ? study.stats[0].value : '';
    var stat1Label = (study.stats && study.stats[0]) ? study.stats[0].label : '';
    var stat2Val   = (study.stats && study.stats[1]) ? study.stats[1].value : '';
    var stat2Label = (study.stats && study.stats[1]) ? study.stats[1].label : '';

    // <a> wrapper — href to /book-a-call; hard-navigated by click interceptor below
    var el = document.createElement('a');
    el.className = 'framer-c52rlm framer-1f1vvtm fdz-cs-card';
    el.href      = '/book-a-call';
    el.innerHTML =
      '<div class="ssr-variant">' +
        '<div class="framer-ubrkdy-container">' +
          '<div class="framer-EhvmC framer-Oe1cm framer-HhvlY framer-1v3z982 framer-v-1v3z982" data-framer-name="Variant 1" style="background-color:var(--token-ba7a9dfd-3e1d-4dea-a25f-9a0d49d43ddf,rgb(250,250,250));width:100%;border-radius:6px;opacity:1;">' +
            '<div class="framer-1wc3ts0" style="border-radius:6px;opacity:1;">' +
              // Top logo area — renders study.logo when set
              '<div class="framer-1anxayh" style="opacity:1;">' + logoImg + '</div>' +
              // Thumbnail image
              '<div class="framer-1ihf2qm" style="filter:grayscale(0);transform:none;opacity:1;">' +
                '<div style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0;" data-framer-background-image-wrapper="true">' +
                  img +
                '</div>' +
                // Grain overlay — matches original exactly
                '<div class="framer-1fy171d-container" style="opacity:1;"><!--$-->' +
                  '<div style="width:100%;height:100%;position:relative;overflow:hidden">' +
                    '<div style="background:url(\'assets/images/variant-1-63.png\');background-size:50px 50px;background-repeat:repeat;position:absolute;inset:-200%;width:400%;height:400%;opacity:0.17"></div>' +
                  '</div>' +
                '<!--/$--></div>' +
              '</div>' +
            '</div>' +
            '<div class="framer-894e3e" style="opacity:1;">' +
              '<div class="framer-7x558y" style="opacity:1;">' +
                // Bottom logo area — renders study.logo when set
                '<div class="framer-jysi4e" style="opacity:1;">' + logoImg + '</div>' +
                // Subtitle / description
                '<div class="framer-u3bmyl" data-framer-component-type="RichTextContainer" style="transform:none;opacity:1;">' +
                  '<p class="framer-text framer-styles-preset-1oy0gio" data-styles-preset="GWVxixWnJ" dir="auto">' + (study.subtitle || '') + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="framer-1asb1rw" style="opacity:1;">' +
                // Stat 1
                '<div class="framer-148mbbl" style="background-color:var(--token-c42c6532-5e43-498f-83ed-eac9f5bec719,rgb(245,245,245));border-radius:4px;opacity:1;">' +
                  '<div class="framer-jvp2kh" data-framer-component-type="RichTextContainer" style="transform:none;opacity:1;">' +
                    '<p class="framer-text framer-styles-preset-e15wf0" data-styles-preset="re7NuBg7S" dir="auto">' + stat1Val + '</p>' +
                  '</div>' +
                  '<div class="framer-28ay0p" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv:var(--token-d224a75c-f8d5-4d92-879a-a5362c414257,rgb(115,115,115));transform:none;opacity:1;">' +
                    '<p class="framer-text framer-styles-preset-1oy0gio" data-styles-preset="GWVxixWnJ" dir="auto" style="--framer-text-color:var(--extracted-r6o4lv,rgb(115,115,115))">' + stat1Label + '</p>' +
                  '</div>' +
                '</div>' +
                // Stat 2
                '<div class="framer-blpzw4" style="background-color:var(--token-c42c6532-5e43-498f-83ed-eac9f5bec719,rgb(245,245,245));border-radius:6px;opacity:1;">' +
                  '<div class="framer-1h2c6bg" data-framer-component-type="RichTextContainer" style="transform:none;opacity:1;">' +
                    '<p class="framer-text framer-styles-preset-e15wf0" data-styles-preset="re7NuBg7S" dir="auto">' + stat2Val + '</p>' +
                  '</div>' +
                  '<div class="framer-1ymqgaw" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv:var(--token-d224a75c-f8d5-4d92-879a-a5362c414257,rgb(115,115,115));transform:none;opacity:1;">' +
                    '<p class="framer-text framer-styles-preset-1oy0gio" data-styles-preset="GWVxixWnJ" dir="auto" style="--framer-text-color:var(--extracted-r6o4lv,rgb(115,115,115))">' + stat2Label + '</p>' +
                  '</div>' +
                '</div>' +
                // Arrow button — references SVG sprite already in page DOM
                '<div class="framer-jl21ws" style="background-color:var(--token-02f86556-091d-4bb0-8fec-70a0faea2fb2,rgb(254,63,1));border-radius:4px;opacity:1;">' +
                  '<div data-framer-component-type="SVG" class="framer-fjt335" aria-hidden="true" style="image-rendering:pixelated;flex-shrink:0;opacity:1;">' +
                    '<div class="svgContainer" style="width:100%;height:100%;aspect-ratio:inherit">' +
                      '<svg style="width:100%;height:100%;overflow:visible;" preserveAspectRatio="none" width="100%" height="100%"><use href="#svg2058856773_653"></use></svg>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    return el;
  }

  function injectMongoCaseStudies() {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname !== '/case-studies') return;

    var container = document.querySelector('.framer-m0p3pe');
    if (!container) return;

    // Hide any cards already present (stale cached HTML, prior SPA nav, etc.)
    // so they can't flash on screen before the fresh MongoDB data lands.
    // Restored on fetch failure so a backend hiccup doesn't leave a blank grid.
    var staleCards = container.querySelectorAll('.framer-c52rlm');
    staleCards.forEach(function (el) { el.style.visibility = 'hidden'; });

    // Show shimmer while fetch is in flight (Risk 2 fix)
    container.classList.add('fdz-cs-loading');

    fetch(API_BASE + '/case-studies')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        container.classList.remove('fdz-cs-loading');

        // Wipe ALL framer-c52rlm cards — both static Framer ones and previously
        // injected MongoDB ones. This handles re-export regressions (Risk 7 fix)
        // and prevents duplicates on SPA re-navigation.
        container.querySelectorAll('.framer-c52rlm').forEach(function (el) {
          el.parentNode.removeChild(el);
        });

        // Empty state (Risk 6 fix)
        if (!result.success || !result.data || result.data.length === 0) {
          var empty = document.createElement('div');
          empty.style.cssText = 'padding:60px 24px;text-align:center;width:100%;color:var(--token-d224a75c-f8d5-4d92-879a-a5362c414257,rgb(115,115,115));';
          empty.innerHTML = '<p class="framer-text framer-styles-preset-1oy0gio" dir="auto">No projects yet — check back soon.</p>';
          container.appendChild(empty);
          return;
        }

        result.data.forEach(function (study) {
          container.appendChild(buildCaseStudyCard(study));
        });

        log('Injected ' + result.data.length + ' MongoDB case study card(s)');
      })
      .catch(function () {
        container.classList.remove('fdz-cs-loading');
        // Fetch failed — reveal whatever was already there rather than
        // leaving the grid blank.
        staleCards.forEach(function (el) { el.style.visibility = ''; });
        log('Case studies fetch failed — skipping injection');
      });
  }

  // ─── Homepage: patch static Framer preview cards with MongoDB data ───────────
  // Homepage case-study/blog cards are NOT rebuilt like the /case-studies and
  // /blog listing pages — we never re-export from Framer, so the DOM structure
  // is permanently frozen. Instead we patch the existing Framer nodes in place
  // (image src, text content) and leave everything else — layout, hover CSS,
  // entrance animation — untouched. Hrefs to /case-studies/:slug are already
  // hard-navigated to /book-a-call by the click interceptor below, so no href
  // changes are needed for case study cards.

  function patchHomepageCaseStudies() {
    var container = document.querySelector('.framer-khu8cz');
    if (!container) return;
    if (container.getAttribute('data-fdz-patched') === 'true') return;

    fetch(API_BASE + '/case-studies')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data || result.data.length === 0) return;

        var cards = container.querySelectorAll('a.framer-lux5qc');
        container.setAttribute('data-fdz-patched', 'true');

        cards.forEach(function (card, i) {
          var study = result.data[i];
          if (!study) {
            card.style.display = 'none';
            return;
          }

          var topLogo    = card.querySelector('.framer-1anxayh img');
          var heroImg    = card.querySelector('.framer-1ihf2qm img');
          var bottomLogo = card.querySelector('.framer-jysi4e img');
          var subtitle   = card.querySelector('.framer-u3bmyl p');
          var stat1Val   = card.querySelector('.framer-jvp2kh p');
          var stat1Label = card.querySelector('.framer-28ay0p p');
          var stat2Val   = card.querySelector('.framer-1h2c6bg p');
          var stat2Label = card.querySelector('.framer-1ymqgaw p');

          [topLogo, bottomLogo].forEach(function (logo) {
            if (!logo) return;
            if (study.logo) {
              logo.src = study.logo;
              logo.style.display = '';
            } else {
              logo.style.display = 'none';
            }
          });

          if (heroImg && study.heroImage) {
            heroImg.removeAttribute('srcset');
            heroImg.removeAttribute('sizes');
            heroImg.src = study.heroImage;
            heroImg.alt = study.title || '';
          }

          if (subtitle) subtitle.textContent = study.subtitle || '';

          if (study.stats && study.stats[0]) {
            if (stat1Val)   stat1Val.textContent   = study.stats[0].value || '';
            if (stat1Label) stat1Label.textContent = study.stats[0].label || '';
          }
          if (study.stats && study.stats[1]) {
            if (stat2Val)   stat2Val.textContent   = study.stats[1].value || '';
            if (stat2Label) stat2Label.textContent = study.stats[1].label || '';
          }
        });

        log('Patched ' + Math.min(cards.length, result.data.length) + ' homepage case study card(s)');
      })
      .catch(function () {
        log('Homepage case studies fetch failed — leaving static cards as-is');
      });
  }

  function patchHomepageBlogPosts() {
    var container = document.querySelector('.framer-8cdppq');
    if (!container) return;
    if (container.getAttribute('data-fdz-patched') === 'true') return;

    fetch(API_BASE + '/blog')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data || result.data.length === 0) return;

        var cards = container.querySelectorAll('a.framer-lux5qc');
        container.setAttribute('data-fdz-patched', 'true');

        cards.forEach(function (card, i) {
          var post = result.data[i];
          if (!post) {
            card.style.display = 'none';
            return;
          }

          var img   = card.querySelector('.framer-zatllq img');
          var date  = card.querySelector('.framer-hvf49r p');
          var title = card.querySelector('.framer-sssdg2 p');

          if (img && post.coverImage) {
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
            img.src = post.coverImage;
            img.alt = post.title || '';
          }
          if (date)  date.textContent  = formatDate(post.createdAt);
          if (title) title.textContent = post.title || '';

          card.href = '/blog/' + post.slug;
        });

        log('Patched ' + Math.min(cards.length, result.data.length) + ' homepage blog card(s)');
      })
      .catch(function () {
        log('Homepage blog fetch failed — leaving static cards as-is');
      });
  }

  // Watch for homepage content to settle after Framer's hydration mutations
  var homeObserver = new MutationObserver(function () {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname !== '/') return;
    patchHomepageCaseStudies();
    patchHomepageBlogPosts();
  });

  homeObserver.observe(document.body, { childList: true, subtree: true });

  // Case study card clicks → hard-navigate to /book-a-call.
  // Uses window.location.href (not router push) to bypass Framer's SPA router
  // entirely, preventing blank-page from React/Framer intercepting internal links.
  // Covers both: original Framer cards (href=./case-studies/slug) and MongoDB
  // cards (href=/book-a-call that Framer's router might try to handle).
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    try {
      var url = new URL(a.href);
      // Any click on /case-studies/:slug or /book-a-call from a case study card
      if (
        (url.pathname.startsWith('/case-studies/') && url.pathname !== '/case-studies') ||
        (url.pathname === '/book-a-call' && a.classList.contains('fdz-cs-card'))
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = '/book-a-call';
      }
    } catch (err) { /* ignore non-parseable hrefs */ }
  }, true);

  // Watch for the blog container to appear in the DOM (handles Framer SPA nav)
  var blogObserver = new MutationObserver(function () {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname !== '/blog') return;
    var container = document.querySelector('.framer-1ur6je4');
    if (!container) return;
    if (container.querySelector('.fdz-mongo-card')) return; // already injected
    injectMongoBlogPosts();
  });

  blogObserver.observe(document.body, { childList: true, subtree: true });

  // Watch for the case studies grid to appear (handles Framer SPA nav)
  var csObserver = new MutationObserver(function () {
    var pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname !== '/case-studies') return;
    var container = document.querySelector('.framer-m0p3pe');
    if (!container) return;
    if (container.querySelector('.fdz-cs-card')) return; // already injected
    injectMongoCaseStudies();
  });

  csObserver.observe(document.body, { childList: true, subtree: true });

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
