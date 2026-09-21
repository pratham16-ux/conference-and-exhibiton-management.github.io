/* =====================================================================
   Stackly Summit — script.js
   ===================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduce = reduceMQ.matches;
  var fine = fineMQ.matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  document.addEventListener('DOMContentLoaded', function () {

    var header = $('.site-header');
    var announce = $('.announce');
    var backTop = $('.back-top');
    var cue = $('.scroll-cue');
    var heroBgs = $$('.hero-bg');
    var timelines = $$('.timeline');
    var frames = $$('.img-frame');
    var navOpen = false;

    /* ---------- Scroll progress bar ---------- */
    var progressWrap = document.createElement('div');
    progressWrap.className = 'scroll-progress';
    progressWrap.setAttribute('aria-hidden', 'true');
    progressWrap.innerHTML = '<div class="scroll-progress-bar"></div>';
    document.body.prepend(progressWrap);
    var progressBar = progressWrap.firstChild;

    /* ---------- Hero / page-hero headline: words rise in ---------- */
    function splitWords(root) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span');
              w.className = 'w';
              var inner = document.createElement('span');
              inner.style.setProperty('--i', i++);
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            walk(n);
          }
        });
      })(root);
    }
    if (!reduce) {
      $$('.hero-content h1, .page-hero h1').forEach(function (h) {
        h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
        splitWords(h);
      });
    }

    /* ---------- Header offset, scroll state, hide-on-scroll-down ---------- */
    var annH = 0, lastY = window.scrollY, ticking = false;
    function measure() {
      annH = announce ? announce.offsetHeight : 0;
      doc.style.setProperty('--announce-h', annH + 'px');
    }
    measure();

    function frame() {
      ticking = false;
      var y = window.scrollY;
      var max = doc.scrollHeight - window.innerHeight;

      progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';

      if (header) {
        header.style.setProperty('--hdr-top', Math.max(0, annH - y) + 'px');
        header.classList.toggle('scrolled', y > 40);
        var dy = y - lastY;
        if (Math.abs(dy) > 4) {
          if (!navOpen && dy > 0 && y > annH + 320) header.classList.add('hide');
          else if (dy < 0 || y < 200) header.classList.remove('hide');
          lastY = y;
        }
      }
      if (backTop) backTop.classList.toggle('show', y > 600);
      if (cue) cue.classList.toggle('gone', y > 80);

      if (!reduce) {
        var vh = window.innerHeight;
        heroBgs.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < vh) el.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
        });
        frames.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var c = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
          el.style.setProperty('--iy', (-clamp(c, -1, 1) * 4).toFixed(2));
        });
      }
      timelines.forEach(function (tl) {
        var r = tl.getBoundingClientRect();
        if (!r.height) return;
        tl.style.setProperty('--p', clamp((window.innerHeight * 0.62 - r.top) / r.height, 0, 1).toFixed(3));
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    frame();

    if (header) header.addEventListener('focusin', function () { header.classList.remove('hide'); });
    if (backTop) backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

    /* ---------- Mobile navigation ---------- */
    var hamburger = $('.hamburger');
    var mobileNav = $('.mobile-nav');
    function setNav(open) {
      navOpen = open;
      hamburger.classList.toggle('open', open);
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) mobileNav.removeAttribute('inert'); else mobileNav.setAttribute('inert', '');
      doc.style.overflow = open ? 'hidden' : '';
      if (open && header) header.classList.remove('hide');
    }
    if (hamburger && mobileNav) {
      hamburger.setAttribute('aria-controls', 'mobile-nav');
      mobileNav.id = 'mobile-nav';
      Array.prototype.forEach.call(mobileNav.children, function (el, i) { el.style.setProperty('--i', i); });
      setNav(false);
      hamburger.addEventListener('click', function () { setNav(!navOpen); });
      $$('a', mobileNav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navOpen) { setNav(false); hamburger.focus(); } });
    }

    /* ---------- Scroll reveal (with automatic stagger + direction) ---------- */
    $$('.grid, .stats-strip, .steps').forEach(function (g) {
      var kids = Array.prototype.filter.call(g.children, function (c) { return c.classList.contains('reveal') || c.classList.contains('step-item'); });
      kids.forEach(function (c, i) { c.style.setProperty('--d', (Math.min(i, 5) * 0.09).toFixed(2) + 's'); });
    });
    $$('.two-col').forEach(function (g) {
      var k = Array.prototype.filter.call(g.children, function (c) { return c.classList.contains('reveal'); });
      if (k[0] && !k[0].hasAttribute('data-anim')) k[0].setAttribute('data-anim', 'left');
      if (k[1] && !k[1].hasAttribute('data-anim')) k[1].setAttribute('data-anim', 'right');
    });
    $$('.price-card.reveal, .cta-banner.reveal').forEach(function (el) { if (!el.hasAttribute('data-anim')) el.setAttribute('data-anim', 'zoom'); });

    var revealEls = $$('.reveal, .step-item');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- Animated counters (eased) ---------- */
    var counters = $$('[data-count]');
    function runCounter(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var isFloat = target % 1 !== 0;
      var dur = 1800, t0 = null;
      // first token of the suffix ('+', '%', 'k') stays full size; any trailing words ('sq.ft') render smaller
      var sp = suffix.indexOf(' ');
      var sMain = sp === -1 ? suffix : suffix.slice(0, sp);
      var sSmall = sp === -1 ? '' : suffix.slice(sp);
      function fmt(v) { return (isFloat ? v.toFixed(1) : Math.round(v).toLocaleString('en-IN')) + sMain; }
      function paint(v) { el.innerHTML = fmt(v) + (sSmall ? '<small>' + sSmall + '</small>' : ''); }
      if (reduce) { paint(target); return; }
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        paint(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(function (el) { runCounter(el); });
    }

    /* ---------- Tabs ---------- */
    $$('[data-tabs]').forEach(function (group) {
      var btns = $$('.tab-btn', group);
      var panelWrap = $(group.getAttribute('data-target'));
      group.setAttribute('role', 'tablist');
      btns.forEach(function (btn) {
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          var key = btn.getAttribute('data-tab');
          $$('.tab-panel', panelWrap).forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === key); });
          if (group.scrollWidth > group.clientWidth) {
            group.scrollTo({ left: btn.offsetLeft - (group.clientWidth - btn.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
          }
          onScroll();
        });
      });
    });

    /* ---------- Accordion ---------- */
    var accItems = $$('.accordion-item');
    accItems.forEach(function (item, n) {
      var btn = $('button', item), panel = $('.accordion-panel', item);
      var id = 'acc-' + n;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      panel.id = id;
      panel.setAttribute('role', 'region');
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        $$('.accordion-item', item.closest('.accordion')).forEach(function (i) {
          i.classList.remove('open');
          $('button', i).setAttribute('aria-expanded', 'false');
          $('.accordion-panel', i).style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });

    /* ---------- Testimonials: crossfade; the active dot is the timer ---------- */
    $$('.testi-slider').forEach(function (slider) {
      var slides = $$('.testi-slide', slider);
      var dots = $$('.testi-dots button', slider);
      var idx = 0;
      function show(i) {
        idx = (i + slides.length) % slides.length;
        slides.forEach(function (s, si) { s.classList.toggle('active', si === idx); s.setAttribute('aria-hidden', si === idx ? 'false' : 'true'); });
        dots.forEach(function (d, di) {
          d.classList.remove('active');
          if (di === idx) { void d.offsetWidth; d.classList.add('active'); }
          d.setAttribute('aria-current', di === idx ? 'true' : 'false');
        });
      }
      dots.forEach(function (d, di) {
        d.setAttribute('aria-label', 'Show testimonial ' + (di + 1));
        d.addEventListener('click', function () { show(di); });
        if (!reduce) d.addEventListener('animationend', function (e) { if (e.animationName === 'dotFill' && d.classList.contains('active')) show(idx + 1); });
      });
      var sx = null;
      slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
      }, { passive: true });
      show(0);
    });

    /* ---------- Countdown ---------- */
    $$('[data-deadline]').forEach(function (box) {
      var deadline = new Date(box.getAttribute('data-deadline')).getTime();
      var els = { d: $('.cd-days', box), h: $('.cd-hours', box), m: $('.cd-mins', box), s: $('.cd-secs', box) };
      var first = true;
      function set(el, val) {
        if (!el) return;
        var str = String(val).padStart(2, '0');
        if (el.textContent === str) return;
        el.textContent = str;
        if (!first && !reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
      }
      function update() {
        var diff = Math.max(0, deadline - Date.now());
        set(els.d, Math.floor(diff / 86400000));
        set(els.h, Math.floor((diff % 86400000) / 3600000));
        set(els.m, Math.floor((diff % 3600000) / 60000));
        set(els.s, Math.floor((diff % 60000) / 1000));
        first = false;
        if (diff === 0) { box.classList.add('is-ended'); clearInterval(timer); }
      }
      var timer = setInterval(update, 1000);
      update();
    });

    /* ---------- Button ripple ---------- */
    $$('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (reduce) return;
        var r = btn.getBoundingClientRect();
        var size = Math.max(r.width, r.height);
        var rip = document.createElement('span');
        rip.className = 'ripple';
        rip.style.width = rip.style.height = size + 'px';
        rip.style.left = (e.clientX - r.left - size / 2) + 'px';
        rip.style.top = (e.clientY - r.top - size / 2) + 'px';
        btn.appendChild(rip);
        setTimeout(function () { rip.remove(); }, 650);
      });
    });

    /* ---------- Pointer-only effects: magnetic buttons, card tilt, spotlight ---------- */
    if (fine && !reduce) {
      $$('.btn-gold, .btn-navy').forEach(function (btn) {
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          btn.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px');
          btn.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px');
        });
        btn.addEventListener('pointerleave', function () { btn.style.removeProperty('--tx'); btn.style.removeProperty('--ty'); });
      });
      $$('.speaker-card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2) + 'deg');
        });
        card.addEventListener('pointerleave', function () { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); });
      });
      $$('.feature-card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }

    /* ---------- Forms ---------- */
    var NAME_RE = /^[A-Za-z ]{2,16}$/;
    var PHONE_RE = /^[6-9][0-9]{9}$/;
    var EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function checkField(field) {
      var rule = field.getAttribute('data-rule');
      var val = field.value.trim();
      var ok = true;
      if (rule === 'name') ok = NAME_RE.test(val);
      if (rule === 'phone') ok = PHONE_RE.test(val);
      if (rule === 'email') ok = EMAIL_RE.test(val);
      if (rule === 'required') ok = val.length > 0;
      var errEl = field.parentElement.querySelector('.err');
      field.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (errEl) errEl.textContent = ok ? '' : (field.getAttribute('data-err') || 'Please check this field');
      return ok;
    }

    $$('form[data-validate]').forEach(function (form) {
      $$('[data-rule]', form).forEach(function (field) {
        field.addEventListener('blur', function () { if (field.value.trim() !== '' || field.classList.contains('invalid')) checkField(field); });
        field.addEventListener('input', function () { if (field.classList.contains('invalid')) checkField(field); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        $$('[data-rule]', form).forEach(function (field) {
          if (!checkField(field) && !firstBad) firstBad = field;
        });
        if (firstBad) {
          $$('.invalid', form).forEach(function (f) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); });
          firstBad.focus({ preventScroll: false });
          return;
        }
        var success = form.parentElement.querySelector('.form-success');
        if (!success) {
          success = document.createElement('div');
          success.className = 'form-success inline';
          success.setAttribute('role', 'status');
          success.innerHTML = '<div class="tick" aria-hidden="true">&#10003;</div><h3>You\'re on the list</h3>';
          form.parentElement.appendChild(success);
        }
        form.style.display = 'none';
        success.classList.add('show');
        if (success.scrollIntoView && !success.classList.contains('inline')) success.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });

    /* ---------- Page transitions (fade out before navigating) ---------- */
    document.addEventListener('click', function (e) {
      if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // hash-only / same page
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { location.href = url.href; }, 260);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

    /* ---------- Resize / motion-preference changes ---------- */
    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        measure();
        if (window.innerWidth >= 1100 && navOpen) setNav(false);
        accItems.forEach(function (i) { if (i.classList.contains('open')) { var p = $('.accordion-panel', i); p.style.maxHeight = p.scrollHeight + 'px'; } });
        onScroll();
      }, 120);
    });
    window.addEventListener('load', function () { measure(); onScroll(); });
  });
})();