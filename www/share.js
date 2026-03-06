/* ============================================================
   🔒 UNIVERSAL: CONTROL PWA + COMPARTIR + METADATOS + DESKTOP
   Funciona en Series, Películas, PWA, TWA, Móvil y PC/Escritorio
   ============================================================ */

/* =============================
   1️⃣ Detectores y Helpers
   ============================= */

   function esDispositivoMovil() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  
  function vieneDeCompartir() {
    const params = new URLSearchParams(window.location.search);
    return params.get("shared") === "true";
  }
  
  function esPWAInstalada() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://")
    );
  }
  
  /* =============================
     2️⃣ Redirección segura
     ============================= */
  
  function comprobarYRedirigirSiCorresponde() {
    try {
      const esPWA = esPWAInstalada();
      const yaEnPaginaInstalar =
        /instalar/i.test(window.location.pathname) ||
        window.location.hostname.includes("infinityfree");
  
      if (esPWA) return console.log("🏠 PWA instalada. No redirige.");
      if (yaEnPaginaInstalar) return console.log("🔁 En página instalar.");
  
      if (esDispositivoMovil() || vieneDeCompartir()) {
        const esLocalhost =
          location.hostname === "localhost" || location.protocol === "file:";
        if (!esLocalhost) {
          console.log("➡ Redirigiendo a página de instalación...");
          window.location.href = "https://digital-knight-download-app.ct.ws/?i=1";
        }
      }
    } catch (e) {
      console.error("❌ Error comprobando PWA:", e);
    }
  }
  
  comprobarYRedirigirSiCorresponde();
  
  /* =============================
     3️⃣ Metadatos OG/Twitter (miniatura real)
     ============================= */
  
  document.addEventListener("DOMContentLoaded", () => {
    const data = document.getElementById("favoritoData");
    if (!data) return;
  
    const nombre = data.querySelector("#nombre")?.textContent?.trim() || "Contenido";
    const enlace = data.querySelector("#favoritoEnlace")?.href || window.location.href;
    const miniatura = data.querySelector("#favoritoImagen")?.src || "";
  
    const descripcion = `Mira "${nombre}" en Digital Knight.`;
  
    const metas = {
      "og:title": nombre,
      "og:description": descripcion,
      "og:image": miniatura,
      "og:url": enlace,
      "og:type": "video.movie",
      "twitter:card": "summary_large_image",
      "twitter:title": nombre,
      "twitter:description": descripcion,
      "twitter:image": miniatura,
    };
  
    for (const prop in metas) {
      let meta = document.querySelector(
        `meta[property='${prop}'], meta[name='${prop}']`
      );
      if (!meta) {
        meta = document.createElement("meta");
        if (prop.startsWith("og:")) meta.setAttribute("property", prop);
        else meta.setAttribute("name", prop);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", metas[prop]);
    }
  
    console.log("✅ Metadatos OG/Twitter generados usando miniatura real.");
  });
  
  /* =============================
     4️⃣ Vista previa antes de compartir
     ============================= */
  
  function mostrarVistaPrevia(nombre, imagen) {
    const preview = document.createElement("div");
    preview.innerHTML = `
      <div style="
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 10px 16px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 99999;
        font-family: Poppins, sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        animation: fadeOut 2.6s forwards;
      ">
        <img src="${imagen}" style="width:120px;height:70px;object-fit:cover;border-radius:8px;">
        <span>Compartiendo <strong>${nombre}</strong>...</span>
      </div>
  
      <style>
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, 20px); }
        }
      </style>
    `;
    document.body.appendChild(preview);
    setTimeout(() => preview.remove(), 2600);
  }
  
 
  
  /* =============================
     6️⃣ Evento Compartir
     ============================= */
  
  document.addEventListener("DOMContentLoaded", () => {
    const compartirBtn = document.getElementById("compartirBtn");
    if (!compartirBtn) return;
  
    compartirBtn.style.zIndex = "99999";
    compartirBtn.style.pointerEvents = "auto";
  
    compartirBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();
  
      const data = document.getElementById("favoritoData");
      const nombre =
        data?.querySelector("#nombre")?.textContent?.trim() || "Contenido";
      const enlace =
        data?.querySelector("#favoritoEnlace")?.href || window.location.href;
      const miniatura = data?.querySelector("#favoritoImagen")?.src || "";
  
      mostrarVistaPrevia(nombre, miniatura);
  
      const texto = `Mira "${nombre}" en Digital Knight`;
  
      try {
        if (navigator.share) {
          await navigator.share({
            title: nombre,
            text: texto,
            url: enlace,
          });
        } else {
          compartirEnDesktop(nombre, enlace);
        }
      } catch (err) {
        console.error("❌ Error al compartir:", err);
        compartirEnDesktop(nombre, enlace);
      }
    });
  });
  