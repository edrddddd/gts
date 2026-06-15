(function () {
  // ─────────────────────────────────────────
  //  CONFIGURACIÓN
  // ─────────────────────────────────────────
  const PAGE_ID      = "645692701952356";
  const ACCESS_TOKEN = "EAANEB7iBXekBRfe1SuOgw9NCvjjq1Ga87TBYhhsPdq5PLUjbKn2QgqYXfel3hL1dWUaA99sqYCPgLZCnrR6IwZAqjZBYW5TPIZBukNWgXKFfuijlLRvK9aHpW49bdNS58ZAZC7b5Q91JYo8mZALgZCEjrwfk8sTCoj40qLkBPTjMiIgQVDwM0ZAicHIHGemkx9noAyK6tExuTBnZA1VOictXyP";
  const NUM_POSTS    = 15;   // cuántos posts mostrar en la grilla
  const API_VERSION  = "v19.0";

  // ─────────────────────────────────────────
  //  Formatear fecha
  // ─────────────────────────────────────────
  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  // ─────────────────────────────────────────
  //  SVG placeholder cuando no hay imagen
  // ─────────────────────────────────────────
  function placeholderImg() {
    return `<div class="gt-card-img-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="1.5">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    </div>`;
  }

  // ─────────────────────────────────────────
  //  Renderizar las tarjetas
  // ─────────────────────────────────────────
  function renderPosts(posts) {
    const container = document.getElementById("gt-grid-container");

    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="gt-error">
        <strong>No hay publicaciones disponibles</strong>
        Aún no hay posts visibles en tu página. Vuelve pronto.
      </div>`;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "gt-grid";

    posts.forEach(function (post) {
      const text    = post.message || post.story || "";
      const imgUrl  = post.full_picture || "";
      const date    = post.created_time ? formatDate(post.created_time) : "";
      const postUrl = post.permalink_url || 
                      `https://www.facebook.com/permalink.php?story_fbid=${post.id.split('_')[1]}&id=${PAGE_ID}`;
      const excerpt = text.length > 220 ? text.slice(0, 220).trim() + "…" : text;

      const card = document.createElement("article");
      card.className = "gt-card";
      card.innerHTML = `
        ${imgUrl
          ? `<img class="gt-card-img" src="${imgUrl}" alt="Publicación de GenomicsTrack" loading="lazy">`
          : placeholderImg()
        }
        <div class="gt-card-body">
          <div class="gt-card-meta">
            <span class="gt-badge">Facebook</span>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${date}
            </span>
          </div>
          ${excerpt ? `<p class="gt-card-text">${excerpt.replace(/\n/g, "<br>")}</p>` : ""}
          <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="gt-card-link">
            Ver publicación
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
        </div>
      `;
      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
  }

  // ─────────────────────────────────────────
  //  Error visual
  // ─────────────────────────────────────────
  function showError(msg) {
    document.getElementById("gt-grid-container").innerHTML = `
      <div class="gt-error">
        <strong>No se pudieron cargar las publicaciones</strong>
        ${msg || "Verifica tu token de acceso o intenta más tarde."}
      </div>`;
  }

  // ─────────────────────────────────────────
  //  Llamada a la Graph API de Meta
  // ─────────────────────────────────────────
  const fields  = "id,message,story,full_picture,permalink_url,created_time";
  const apiUrl  = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/posts`
                + `?fields=${fields}`
                + `&limit=${NUM_POSTS}`
                + `&access_token=${ACCESS_TOKEN}`;

  fetch(apiUrl)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) {
        console.error("Meta API error:", data.error);
        showError(data.error.message);
        return;
      }
      renderPosts(data.data || []);
    })
    .catch(function (err) {
      console.error("Fetch error:", err);
      showError("Error de red al conectar con Facebook.");
    });
})();