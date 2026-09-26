(() => {
  'use strict';
  const container = document.querySelector('#gt-grid-container');
  const status = document.querySelector('#news-status');
  const retry = document.querySelector('#news-retry');
  if (!container || !status || !retry) return;

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  function safeUrl(value, domains) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? url.href : '';
    } catch { return ''; }
  }
  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  }
  function renderPosts(posts) {
    const fragment = document.createDocumentFragment();
    for (const post of posts.slice(0, 15)) {
      if (!post || typeof post !== 'object') continue;
      const link = safeUrl(post.permalink_url, ['facebook.com']);
      if (!link) continue;
      const card = node('article', 'news-card card');
      const picture = safeUrl(post.full_picture, ['fbcdn.net', 'facebook.com', 'fbsbx.com']);
      if (picture) {
        const image = node('img', 'news-card-image');
        image.src = picture;
        image.alt = 'Imagen de la publicación de GenomicsTrack';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.width = 720;
        image.height = 450;
        image.addEventListener('error', () => image.remove(), { once: true });
        card.append(image);
      }
      const body = node('div', 'news-card-body');
      const meta = node('div', 'news-card-meta');
      meta.append(node('span', 'badge', 'Facebook'));
      const date = new Date(post.created_time);
      if (post.created_time && !Number.isNaN(date.valueOf())) {
        const time = node('time', '', dateFormatter.format(date));
        time.dateTime = date.toISOString();
        meta.append(time);
      }
      const message = typeof post.message === 'string' ? post.message.trim() : '';
      const excerpt = message.length > 400 ? `${message.slice(0, 400).trimEnd()}…` : message;
      const anchor = node('a', 'text-link', 'Ver publicación ↗');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      body.append(meta, node('p', 'news-card-text', excerpt || 'Consulta esta publicación en Facebook.'), anchor);
      card.append(body);
      fragment.append(card);
    }
    container.replaceChildren(fragment);
    return container.children.length;
  }
  async function loadPosts() {
    container.setAttribute('aria-busy', 'true');
    status.textContent = 'Cargando las últimas publicaciones…';
    retry.hidden = true;
    retry.disabled = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/noticias', { signal: controller.signal, headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!response.ok) throw new Error('Unavailable');
      const payload = await response.json();
      if (!Array.isArray(payload.posts)) throw new Error('Invalid response');
      const count = renderPosts(payload.posts);
      if (!count) status.textContent = 'No hay publicaciones disponibles aquí por ahora. Visita nuestra página de Facebook para ver las novedades.';
      else if (payload.stale) status.textContent = 'Mostramos las últimas publicaciones guardadas. Puedes consultar las novedades más recientes en Facebook.';
      else status.textContent = `${count} ${count === 1 ? 'publicación disponible' : 'publicaciones disponibles'}.`;
    } catch {
      status.textContent = 'Las publicaciones no están disponibles aquí en este momento. Puedes seguir las novedades directamente en Facebook.';
      retry.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      retry.disabled = false;
      container.setAttribute('aria-busy', 'false');
    }
  }
  retry.addEventListener('click', loadPosts);
  loadPosts();
})();
