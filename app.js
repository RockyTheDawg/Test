'use strict';

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
let active = 0;
function selectPhoto(index) {
  active = (index + gallery.length) % gallery.length;
  full.src = gallery[active].src;
  full.alt = gallery[active].alt;
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
    selectPhoto(active + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let touchStart = null;
full.addEventListener('touchstart', event => {
  touchStart = event.changedTouches[0].clientX;
}, {passive:true});
full.addEventListener('touchend', event => {
  if (touchStart === null) return;
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 60) selectPhoto(active + (distance < 0 ? 1 : -1));
  touchStart = null;
}, {passive:true});

// Alternate the two saved collections; choose a random track within each.
function chooseNextSong(tracks, state = {}, random = Math.random) {
  const groups = ['country', 'modern'].filter(group => tracks.some(song => song.playlist === group));
  if (!groups.length) throw new Error('No music collections available');
  const group = groups.length === 1 ? groups[0] :
    state.playlist === 'country' ? 'modern' : state.playlist === 'modern' ? 'country' : groups[Math.floor(random() * groups.length)];
  const pool = tracks.filter(song => song.playlist === group);
  const fresh = pool.filter(song => song.id !== state.lastSongs?.[group]);
  const choices = fresh.length ? fresh : pool;
  const song = choices[Math.floor(random() * choices.length)];
  return { song, state: { playlist: group, lastSongs: { ...state.lastSongs, [group]: song.id } } };
}
let songs = [];
let musicState = {};
let musicUpdatedAt = 0;
try { musicState = JSON.parse(localStorage.getItem('test-portfolio-music-mix') || '{}') || {}; } catch {}
let musicVisit = 0;
async function selectMusic() {
  const visit = ++musicVisit;
  if (!songs.length) {
    const response = await fetch("music.json");
    if (!response.ok) throw new Error("Music unavailable");
    songs = await response.json();
  }
  if (visit !== musicVisit) return;
  const selection = chooseNextSong(songs, musicState);
  const song = selection.song;
  musicState = selection.state;
  musicUpdatedAt = Date.now();
  try { localStorage.setItem('test-portfolio-music-mix', JSON.stringify(musicState)); } catch {}
  const details = document.createElement("div");
  const title = document.createElement("h3");
  const artist = document.createElement("p");
  title.textContent = song.title;
  artist.textContent = song.artist;
  details.append(title, artist);
  if (song.preview) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = song.preview;
    audio.setAttribute("aria-label", "Preview of " + song.title);
    details.append(audio);
  }
  const links = document.createElement("div");
  links.className = "music-links";
  for (const [label, url] of [
    ["Spotify", "https://open.spotify.com/track/" + song.id],
    ["Apple Music", "https://music.apple.com/us/search?term=" + encodeURIComponent(song.title + " " + song.artist)]
  ]) {
    const link = document.createElement("a");
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'service-icon');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (label === 'Spotify') {
      path.setAttribute('d', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM6 8.5c4-1.3 8-1 12 1M7 12c3-1 6.5-.7 9.5 1M8 15.5c2.3-.6 4.8-.4 7 .7');
    } else {
      path.setAttribute('d', 'M9 17V6l11-3v11M9 9l11-3M9 17c0 1.7-2 3-4 3s-3-1-3-2 2-3 4-3 3 1 3 2Zm11-3c0 1.7-2 3-4 3s-3-1-3-2 2-3 4-3 3 1 3 2Z');
    }
    icon.append(path);
    link.append(icon, document.createTextNode(label));
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link);
  }
  const artwork = document.createElement("div");
  artwork.className = "music-artwork";
  document.querySelector("#track").replaceChildren(artwork, links, details);
  fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent("https://open.spotify.com/track/" + song.id))
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (visit !== musicVisit || !data?.thumbnail_url) return;
      const cover = new Image();
      cover.alt = "Album artwork for " + song.title;
      cover.onload = () => { if (visit === musicVisit) artwork.prepend(cover); };
      cover.src = data.thumbnail_url;
    }).catch(() => {});
}
function loadMusic() {
  musicUpdatedAt = Date.now();
  const track = document.querySelector('#track');
  track.setAttribute('aria-busy', 'true');
  selectMusic().catch(() => { track.textContent = 'Music is temporarily unavailable. Try another track.'; })
    .finally(() => track.setAttribute('aria-busy', 'false'));
}
loadMusic();
function refreshMusic() {
  if (document.hidden || Date.now() - musicUpdatedAt < 60000) return;
  const audio = document.querySelector('#track audio');
  if (audio && !audio.paused && !audio.ended) return;
  loadMusic();
}
setInterval(refreshMusic, 1000);
document.addEventListener('visibilitychange', refreshMusic);


document.querySelector('#next-song').addEventListener('click', loadMusic);

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('mrdiegog2405@gmail.com');
    status.textContent = 'Email copied.';
  } catch {
    status.textContent = 'Email: mrdiegog2405@gmail.com';
  }
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = [...document.querySelectorAll('.hero-copy, .terminal-wrap, .section-heading, .project-card, .about-grid, .job, .music-panel, footer')];
let revealObserver;
function startReveals() {
  revealObserver?.disconnect();
  revealItems.forEach(element => element.classList.remove('reveal', 'revealed'));
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  revealItems.forEach(element => element.classList.add('reveal'));
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:0, rootMargin:'0px 0px -12px 0px'});
  requestAnimationFrame(() => requestAnimationFrame(() => {
    revealItems.forEach(element => revealObserver.observe(element));
  }));
}
startReveals();
window.addEventListener('pageshow', event => { if (event.persisted) startReveals(); });
reducedMotion.addEventListener('change', startReveals);

