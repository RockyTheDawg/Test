// Run before page content so browser restoration cannot flash the previous section.
'use strict';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
function startAtTop() {
  window.scrollTo({top: 0, left: 0, behavior: 'instant'});
  document.documentElement.classList.remove('landing-enter');
  requestAnimationFrame(() => document.documentElement.classList.add('landing-enter'));
}
window.addEventListener('pageshow', startAtTop);
