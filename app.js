'use strict';

// A separate five-second cooldown for each action; duplicate links share a timer.
// Persist deadlines so refreshing or opening another tab cannot reset a download.
const cooldownMs = 5000;
const cooldownStorageKey = 'test-site-action-cooldowns-v1';
const cooldowns = new Map();
const controls = [...document.querySelectorAll('a[href], button')];
const originalTitles = new Map(controls.map(control => [control, control.getAttribute('title')]));
const actionKeys = new Map(controls.map((control, index) => [control,
  control.id === 'prev' || control.id === 'next' ? 'gallery-navigation' :
  control.getAttribute('href') || control.id || `control-${index}`]));
const cooldownStatuses = [document.body, ...document.querySelectorAll('dialog')].map(parent => {
  const status = document.createElement('p');
  status.className = 'cooldown-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  parent.append(status);
  return status;
});
let cooldownTimer;
let lastActionKey;
function readCooldowns() {
  try {
    const saved = JSON.parse(localStorage.getItem(cooldownStorageKey) || '{}');
    for (const [key, deadline] of Object.entries(saved)) {
      if (Number.isFinite(deadline) && deadline > Date.now() && deadline <= Date.now() + cooldownMs) {
        cooldowns.set(key, Math.max(deadline, cooldowns.get(key) || 0));
      }
    }
  } catch { /* Continue with in-memory timers when storage is unavailable. */ }
}
function refreshCooldowns() {
  const now = Date.now();
  for (const [key, deadline] of cooldowns) if (deadline <= now) cooldowns.delete(key);
  for (const control of controls) {
    const remaining = Math.ceil(((cooldowns.get(actionKeys.get(control)) || 0) - now) / 1000);
    control.classList.toggle('cooldown-active', remaining > 0);
    if (remaining > 0) {
      control.setAttribute('aria-disabled', 'true');
      control.title = `Ready again in ${remaining}s`;
    } else {
      control.removeAttribute('aria-disabled');
      const title = originalTitles.get(control);
      if (title === null) control.removeAttribute('title');
      else control.title = title;
    }
  }
  const seconds = Math.ceil(((cooldowns.get(lastActionKey) || 0) - now) / 1000);
  for (const status of cooldownStatuses) {
    status.hidden = seconds <= 0;
    const text = seconds > 0 ? `You can use this action again in ${seconds}s.` : '';
    if (status.textContent !== text) status.textContent = text;
  }
  if (cooldowns.size && !cooldownTimer) cooldownTimer = setInterval(refreshCooldowns, 100);
  if (!cooldowns.size) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
}
function guardInteraction(event) {
  if (event.type === 'auxclick' && event.button !== 1) return;
  const control = event.target.closest('a[href], button');
  if (!control || !actionKeys.has(control)) return;
  readCooldowns();
  const key = actionKeys.get(control);
  lastActionKey = key;
  if ((cooldowns.get(key) || 0) > Date.now()) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else {
    cooldowns.set(key, Date.now() + cooldownMs);
    try { localStorage.setItem(cooldownStorageKey, JSON.stringify(Object.fromEntries(cooldowns))); } catch {}
  }
  refreshCooldowns();
}
document.addEventListener('click', guardInteraction, true);
document.addEventListener('auxclick', guardInteraction, true);
window.addEventListener('storage', event => {
  if (event.key === cooldownStorageKey) { readCooldowns(); refreshCooldowns(); }
});
window.addEventListener('pageshow', () => { readCooldowns(); refreshCooldowns(); });
readCooldowns();
refreshCooldowns();

const header = document.querySelector('.site-header');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const mobile = matchMedia('(max-width:767px)');
function closeMenu(returnFocus = false) {
  header.classList.remove('menu-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) menu.focus();
}
menu.hidden = false;
header.classList.add('nav-ready');
menu.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  closeMenu();
  const target = document.querySelector(link.hash);
  if (target) {
    target.tabIndex = -1;
    target.focus({preventScroll:true});
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
});
mobile.addEventListener('change', () => {
  const focused = document.activeElement;
  closeMenu();
  if (mobile.matches && navigation.contains(focused)) menu.focus();
  if (!mobile.matches && focused === menu) document.querySelector('.brand').focus();
});
window.addEventListener('pageshow', () => closeMenu());

// Native dialogs retain keyboard focus and restore it to the triggering control.
const dialogs = [...document.querySelectorAll('dialog')];
function updateScrollLock() {
  document.body.classList.toggle('modal-open', dialogs.some(dialog => dialog.open));
}
function openDialog(dialog) {
  dialog.showModal();
  updateScrollLock();
}
dialogs.forEach(dialog => {
  dialog.addEventListener('close', updateScrollLock);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
document.querySelectorAll('[data-dialog]').forEach(button =>
  button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.dialog))));
document.querySelectorAll('[data-close]').forEach(button =>
  button.addEventListener('click', () => button.closest('dialog').close()));

const gallery = [...document.querySelectorAll('.tile img')];
const galleryPage = document.querySelector('#gallery-page');
const lightbox = document.querySelector('#lightbox');
const full = document.querySelector('#full');
// Include the original cover alongside the existing gallery; avoid a repeat on return.
const galleryCover = document.querySelector('#gallery-cover');
const coverPool = [{src: galleryCover.getAttribute('src'), alt: galleryCover.alt},
  ...gallery.map(image => ({src: image.getAttribute('src'), alt: image.alt}))];
let lastCover = '';
function randomizeGalleryCover() {
  try { lastCover = sessionStorage.getItem('test-gallery-cover') || lastCover; } catch {}
  const choices = coverPool.filter(photo => photo.src !== lastCover);
  const photo = choices[Math.floor(Math.random() * choices.length)];
  galleryCover.src = photo.src;
  galleryCover.alt = photo.alt;
  lastCover = photo.src;
  try { sessionStorage.setItem('test-gallery-cover', photo.src); } catch {}
}
window.addEventListener('pageshow', randomizeGalleryCover);

const hobbiesPhoto = document.querySelector('.about-photo img');
const hobbiesCaption = document.querySelector('.about-photo figcaption');
// Use only photos with supplied captions so the image and description always match.
const hobbiesPool = gallery.map(image => ({
  src: image.getAttribute('src'),
  alt: image.alt,
  caption: image.closest('.tile').dataset.location
})).filter(photo => photo.caption);
let lastHobbiesPhoto = hobbiesPhoto.getAttribute('src');
function randomizeHobbiesPhoto() {
  try { lastHobbiesPhoto = sessionStorage.getItem('test-hobbies-photo') || lastHobbiesPhoto; } catch {}
  const choices = hobbiesPool.filter(photo => photo.src !== lastHobbiesPhoto);
  if (!choices.length) return;
  const photo = choices[Math.floor(Math.random() * choices.length)];
  hobbiesPhoto.src = photo.src;
  hobbiesPhoto.alt = photo.alt;
  hobbiesCaption.textContent = photo.caption;
  lastHobbiesPhoto = photo.src;
  try { sessionStorage.setItem('test-hobbies-photo', photo.src); } catch {}
}
window.addEventListener('pageshow', randomizeHobbiesPhoto);

let active = 0;
function selectPhoto(index) {
  active = (index + gallery.length) % gallery.length;
  full.src = gallery[active].src;
  full.alt = gallery[active].alt;
  document.querySelector('#photo-location').textContent = gallery[active].closest('.tile').dataset.location || '';
  document.querySelector('#count').textContent = (active + 1) + ' of ' + gallery.length;
}
document.querySelector('#gallery-open').addEventListener('click', () => openDialog(galleryPage));
document.querySelector('#gallery-back').addEventListener('click', () => galleryPage.close());
gallery.forEach((image, index) => image.closest('button').addEventListener('click', () => {
  selectPhoto(index);
  openDialog(lightbox);
}));
document.querySelector('#prev').addEventListener('click', () => selectPhoto(active - 1));
document.querySelector('#next').addEventListener('click', () => selectPhoto(active + 1));
document.querySelector('#close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    document.querySelector(event.key === 'ArrowRight' ? '#next' : '#prev').click();
  }
});
let touchStart = null;
full.addEventListener('touchstart', event => {
  touchStart = event.changedTouches[0].clientX;
}, {passive:true});
full.addEventListener('touchend', event => {
  if (touchStart === null) return;
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 60) document.querySelector(distance < 0 ? '#next' : '#prev').click();
  touchStart = null;
}, {passive:true});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = [...document.querySelectorAll('.section-heading, .project-card, .about-grid, .job, .contact-card')];
let revealObserver;
function startReveals() {
  revealObserver?.disconnect();
  revealItems.forEach(element => element.classList.remove('reveal'));
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal');
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:0.08});
  revealItems.forEach(element => revealObserver.observe(element));
}
startReveals();
window.addEventListener('pageshow', event => { if (event.persisted) startReveals(); });
reducedMotion.addEventListener('change', startReveals);

