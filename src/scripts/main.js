import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    // "Start a project" / "Contact": open the popup unless the contact form is already on screen
    if (a.getAttribute('href') === '#contact' && !contactInView()) {
      e.preventDefault();
      openModal(a);
      return;
    }
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0 });
  });
});

function contactInView() {
  const section = $('#contact');
  if (!section) return false;
  const r = section.getBoundingClientRect();
  return r.top < window.innerHeight * 0.6 && r.bottom > 0;
}

/* ---------- Start a project popup ---------- */
const modal = $('[data-project-modal]');
let modalTrigger = null;

function openModal(trigger) {
  if (!modal || !modal.hidden) return;
  modalTrigger = trigger;
  modal.hidden = false;
  lenis.stop();
  gsap.fromTo($('.pm__backdrop', modal), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
  gsap.fromTo(
    $('[data-modal-panel]', modal),
    { autoAlpha: 0, y: 60, scale: 0.97 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' },
  );
  setTimeout(() => $('input:not([tabindex="-1"])', modal)?.focus({ preventScroll: true }), 300);
}

function closeModal() {
  if (!modal || modal.hidden || modal.dataset.closing) return;
  modal.dataset.closing = 'true';
  const finish = () => {
    if (!modal.dataset.closing) return;
    delete modal.dataset.closing;
    modal.hidden = true;
    lenis.start();
    modalTrigger?.focus({ preventScroll: true });
  };
  gsap.to($('[data-modal-panel]', modal), { autoAlpha: 0, y: 40, duration: 0.4, ease: 'power2.in' });
  gsap.to($('.pm__backdrop', modal), { autoAlpha: 0, duration: 0.45, ease: 'power2.in', onComplete: finish });
  // animations pause in background tabs; never leave the popup stuck open
  setTimeout(finish, 600);
}

if (modal) {
  $$('[data-modal-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    // keep keyboard focus inside the popup
    if (e.key === 'Tab') {
      const focusable = $$('a[href], button:not([hidden]), input:not([tabindex="-1"]), textarea', modal).filter(
        (el) => el.offsetParent !== null,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ---------- preloader → hero intro ---------- */
function intro() {
  // shared by the homepage hero and the inner-page heroes; missing pieces are skipped
  const tl = gsap.timeline();
  const lines = $$('[data-hero-line]');
  const mark = $('[data-hero-mark]');
  const fades = $$('[data-hero-fade]');
  if (lines.length) tl.from(lines, { yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'expo.out' }, 0);
  if (mark) tl.from(mark, { autoAlpha: 0, scale: 0.92, duration: 1.8, ease: 'expo.out' }, 0);
  if (fades.length) tl.from(fades, { autoAlpha: 0, y: 20, duration: 1, stagger: 0.07, ease: 'power3.out' }, 0.3);
  tl.from('[data-header]', { autoAlpha: 0, y: -20, duration: 1, ease: 'power3.out' }, 0.4);
  return tl;
}

function preloader() {
  const el = $('[data-preloader]');
  const done = () => {
    document.body.classList.remove('is-loading');
    lenis.start();
    ScrollTrigger.refresh();
  };
  if (reduced) {
    el?.remove();
    done();
    return;
  }
  // inner pages have no preloader: go straight to the hero intro
  if (!el) {
    done();
    intro();
    return;
  }
  const counter = { v: 0 };
  const count = $('[data-preloader-count]');
  gsap
    .timeline()
    .from('[data-preloader-mark]', { autoAlpha: 0, scale: 0.9, duration: 0.8, ease: 'power3.out' }, 0)
    .to('[data-preloader-fill]', { clipPath: 'inset(0% 0 0 0)', duration: 1.9, ease: 'power2.inOut' }, 0.1)
    .to(counter, {
      v: 100,
      duration: 1.9,
      ease: 'power2.inOut',
      onUpdate: () => (count.textContent = Math.round(counter.v)),
    }, 0.1)
    .to('[data-preloader-mark]', { rotationY: 360, transformPerspective: 900, duration: 1, ease: 'expo.inOut' }, '+=0.05')
    .to('[data-preloader-mark]', { scale: 1.6, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, '-=0.35')
    .to(el, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.35')
    .add(() => {
      el.remove();
      done();
    })
    .add(intro(), '-=0.55');
}

/* ---------- hero ---------- */
function hero() {
  if (!$('[data-hero]')) return;
  const mark = $('[data-hero-mark]');
  const tilt = $('[data-hero-tilt]');
  const spin = $('[data-hero-spin]');

  // the logo spins on its vertical axis; scrolling speeds it up
  if (spin && !reduced) {
    const turn = gsap.to(spin, { rotationY: 360, duration: 16, ease: 'none', repeat: -1 });
    lenis.on('scroll', ({ velocity }) => {
      const boost = 1 + Math.min(Math.abs(velocity) / 4, 8);
      gsap.to(turn, { timeScale: velocity < 0 ? -boost : boost, duration: 0.4, overwrite: true });
    });

    // pointer tilts the whole spinning mark
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.2, ease: 'power3.out' });
    const rz = gsap.quickTo(tilt, 'rotationZ', { duration: 1.2, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      rx(-y * 18);
      rz(x * -6);
    });
  }

  // logo drifts up and away while scrolling past the hero
  gsap.to(mark, {
    yPercent: -18,
    scale: 1.08,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
  });

  // wordmark marquee, nudged by scroll velocity
  const track = $('[data-marquee]');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    lenis.on('scroll', ({ velocity }) => {
      const boost = 1 + Math.min(Math.abs(velocity) / 6, 5);
      gsap.to(loop, { timeScale: velocity < 0 ? -boost : boost, duration: 0.3, overwrite: true });
    });
  }

}

/* ---------- image preview following the cursor over a list ---------- */
function preview() {
  const preview = $('[data-cursor-preview]');
  if (preview) {
    const img = $('img', preview);
    // offset from the cursor, set per page: the hero list sits on the right, so its preview shows to the left
    const ox = Number(preview.dataset.offsetX ?? -340);
    const oy = Number(preview.dataset.offsetY ?? -110);
    const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3.out' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3.out' });
    $$('[data-preview]').forEach((item) => {
      item.addEventListener('pointerenter', () => {
        img.src = item.dataset.preview;
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
      });
      item.addEventListener('pointerleave', () => {
        gsap.to(preview, { autoAlpha: 0, scale: 0.8, duration: 0.4, ease: 'power3.out' });
      });
      item.addEventListener('pointermove', (e) => {
        px(e.clientX + ox);
        py(e.clientY + oy);
      });
    });
  }
}

/* ---------- one-word display headlines shrink until they fit their column ---------- */
function fit() {
  const run = () =>
    $$('[data-fit]').forEach((el) => {
      el.style.fontSize = '';
      const over = el.scrollWidth / el.clientWidth;
      if (over > 1) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) / over) * 0.98}px`;
    });
  run();
  document.fonts.ready.then(run);
  window.addEventListener('resize', run);
}

/* ---------- generic reveals ---------- */
function reveals() {
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 40,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  $$('[data-reveal-line]').forEach((el) => {
    gsap.from(el, {
      yPercent: 110,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el.parentElement, start: 'top 90%' },
    });
  });

  // statement lights up word by word as you read
  $$('[data-words]').forEach((el) => {
    gsap.to($$('.w', el), {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true },
    });
  });
}

/* ---------- horizontal project rail ---------- */
function work() {
  const section = $('[data-work]');
  const track = $('[data-work-track]');
  const index = $('[data-work-index]');
  if (!section || !track) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth + window.innerWidth * 0.06;
    const cards = $$('.card:not(.card--end)', track);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance() * 1.6}`,
        pin: '[data-work-pin]',
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
          index.textContent = String(i).padStart(2, '0');
        },
      },
    });
  });
}

/* ---------- stacked method panels ---------- */
function method() {
  const panels = $$('[data-panel]');
  panels.forEach((panel, i) => {
    const next = panels[i + 1];
    if (!next) return;
    gsap.to($('.panel__inner', panel), {
      scale: 0.9,
      autoAlpha: 0.35,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
    });
  });
  panels.forEach((panel) => {
    gsap.from($('.panel__title', panel), {
      yPercent: 40,
      autoAlpha: 0,
      ease: 'power3.out',
      duration: 1.1,
      scrollTrigger: { trigger: panel, start: 'top 60%' },
    });
  });
}

/* ---------- services list highlight ---------- */
function services() {
  $$('[data-svc]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 58%',
      end: 'bottom 42%',
      toggleClass: 'is-active',
    });
  });
}

/* ---------- footer wordmark ---------- */
function footer() {
  // plays once as the footer comes in; a scrubbed version could stall short of the bottom on fast scrolls
  gsap.from('[data-footer-mark]', {
    yPercent: 70,
    duration: 1.6,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 75%' },
  });
}

/* ---------- 3-step contact form (contact section and popup each get their own) ---------- */
function forms() {
  $$('[data-form]').forEach(setupForm);
}

function setupForm(f) {
  const panels = $$('[data-step]', f);
  const next = $('[data-form-next]', f);
  const back = $('[data-form-back]', f);
  const count = $('[data-form-count]', f);
  const question = $('[data-form-question]', f);
  const bar = $('[data-form-bar]', f);
  let step = 0;

  const show = (n) => {
    step = n;
    panels.forEach((p, i) => p.classList.toggle('is-active', i === n));
    const done = n === panels.length - 1;
    count.textContent = String(Math.min(n + 1, 3)).padStart(2, '0');
    question.textContent = panels[n].dataset.question || 'Sent';
    bar.style.width = `${(Math.min(n + 1, 3) / 3) * 100}%`;
    back.hidden = n === 0 || done;
    next.hidden = done;
    next.textContent = n === 2 ? 'Send' : 'Continue';
  };

  const valid = () => {
    if (step !== 0) return true;
    let ok = true;
    $$('input[required]', panels[0]).forEach((input) => {
      const good = input.checkValidity() && input.value.trim();
      input.closest('.field').classList.toggle('is-invalid', !good);
      if (!good) ok = false;
    });
    return ok;
  };

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid()) return;
    if (step < 2) return show(step + 1);
    if (f.company.value) return; // honeypot

    // No backend yet: hand the brief to the visitor's mail app.
    const data = new FormData(f);
    const body = [
      `Name: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `Services: ${data.getAll('service').join(', ') || '-'}`,
      `Budget: ${data.get('budget') || '-'}`,
      '',
      data.get('message') || '',
    ].join('\n');
    window.location.href = `mailto:${f.dataset.email}?subject=${encodeURIComponent('New project inquiry')}&body=${encodeURIComponent(body)}`;
    show(3);
  });
  back.addEventListener('click', () => show(Math.max(0, step - 1)));
}

/* ---------- work page category filter ---------- */
function filter() {
  const buttons = $$('[data-filter]');
  const items = $$('[data-category]');
  const count = $('[data-filter-count]');
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const shown = items.filter((el) => cat === 'all' || el.dataset.category === cat);
      gsap.to(items, {
        autoAlpha: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          items.forEach((el) => (el.hidden = !shown.includes(el)));
          // keep the image left/right alternation intact for the filtered list
          shown.forEach((el, i) => el.classList.toggle('is-flip', i % 2 === 1));
          if (count) count.textContent = String(shown.length).padStart(2, '0');
          gsap.fromTo(shown, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
          ScrollTrigger.refresh();
        },
      });
    });
  });
}

/* ---------- cover images drift slower than the page ---------- */
function parallax() {
  if (reduced) return;
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* ---------- article contents: highlight the section being read ---------- */
function toc() {
  const links = $$('[data-toc-link]');
  links.forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      endTrigger: links[links.indexOf(link) + 1] ? $(links[links.indexOf(link) + 1].getAttribute('href')) : '.prose',
      end: links[links.indexOf(link) + 1] ? 'top 40%' : 'bottom 40%',
      toggleClass: { targets: link, className: 'is-active' },
    });
  });
}

// FAQ accordions change page height, so scroll positions need recomputing
$$('details').forEach((d) => d.addEventListener('toggle', () => ScrollTrigger.refresh()));

hero();
preview();
filter();
parallax();
toc();
fit();
reveals();
work();
method();
services();
footer();
forms();
preloader();

window.addEventListener('load', () => ScrollTrigger.refresh());
