
(function() {
  // Evita duplicar el script si ya se cargó
  if (window.__spaLoader) return;
  window.__spaLoader = true;

  async function loadPage(url, addToHistory = true) {
    try {
      // Carga el HTML nuevo
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar la página");
      const text = await response.text();

      // Crea un DOM temporal para extraer solo el <body>
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const newBody = doc.body;

      // Reemplaza el contenido del body actual sin borrar el script SPA
      document.body.innerHTML = newBody.innerHTML;

      // Re-ejecuta scripts incluidos en la nueva página
      const scripts = newBody.querySelectorAll("script");
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        if (oldScript.src) newScript.src = oldScript.src;
        else newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
      });

      if (addToHistory) window.history.pushState({}, "", url);

      // Vuelve a activar los enlaces
      attachLinks();
    } catch (err) {
      console.error("Error al cambiar de página:", err);
      window.location.href = url; // fallback si algo falla
    }
  }

  function attachLinks() {
    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");

      // Ignora enlaces externos o con #
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        link.target === "_blank"
      ) return;

      link.addEventListener("click", e => {
        e.preventDefault();
        loadPage(href);
      });
    });
  }

  // Escucha el botón atrás/adelante
  window.addEventListener("popstate", () => loadPage(location.href, false));

  attachLinks();
})();

