'use strict';
document.documentElement.classList.remove('no-js');
document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('menu-toggle');
  const navigation = document.getElementById('site-navigation');
  const backdrop = document.getElementById('menu-backdrop');
  if (!trigger || !navigation || !backdrop) return;
  const isMobile = window.matchMedia('(max-width: 800px)');
  function closeMenu(restore = false) {
    navigation.dataset.open = 'false';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Abrir menú de navegación');
    backdrop.hidden = true;
    document.body.classList.remove('menu-open');
    if (restore) trigger.focus();
  }
  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') return closeMenu(true);
    navigation.dataset.open = 'true';
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Cerrar menú de navegación');
    backdrop.hidden = false;
    document.body.classList.add('menu-open');
    navigation.querySelector('a').focus();
  });
  backdrop.addEventListener('click', () => closeMenu(true));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (trigger.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.key === 'Tab') {
      const links = [...navigation.querySelectorAll('a[href]')];
      const first = links[0], last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); trigger.focus(); }
      else if (event.shiftKey && document.activeElement === trigger) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); trigger.focus(); }
    }
  });
  isMobile.addEventListener('change', () => closeMenu());
});
