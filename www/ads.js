// =========================================================
// Banner de Anuncios Digital Knight (ads.js)
// =========================================================
// Solo muestra un banner moderno abajo para usuarios NO premium.
// Al hacerse premium, el banner desaparece automaticamente.
// No aparece en: premium.html, perfil, buscador
// =========================================================

(function () {
  "use strict";

  function esPremium() {
    try {
      const p = JSON.parse(localStorage.getItem("dk_profile") || "{}");
      return p.premium === true;
    } catch (e) {
      return false;
    }
  }

  // Paginas donde el banner NO debe mostrarse
  function esPaginaExcluida() {
    const path = window.location.pathname.toLowerCase();
    const excluidas = [
      "/index.html",
      "/premium.html",
      "/perfil-2026.html",
      "/perfil digital knight 2025.html",
      "/perfil2025.html",
      "/perfil-old.html",
      "/perfil test.html",
      "/perfil dragon ball 2025.html",
      "/new search page 2025.html",
      "/search.html",
      "/buscar.html"
    ];
    return excluidas.some(p => path.includes(p.replace(".html", "")));
  }

  function crearBanner() {
    if (esPremium()) return null;
    if (esPaginaExcluida()) return null;
    if (typeof document === "undefined") return null;

    const banner = document.createElement("div");
    banner.id = "dk-banner-premium";
    banner.style.cssText = "position:fixed;bottom:120px;left:12px;right:12px;background:linear-gradient(135deg,#01011d 0%,#05051d 100%);border:1px solid rgba(0,125,255,0.3);border-radius:14px;padding:12px 16px;z-index:2147483600;box-shadow:0 8px 32px rgba(0,125,255,0.15),0 4px 16px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;backdrop-filter:blur(8px);";

    const texto = document.createElement("div");
    texto.style.cssText = "flex:1;min-width:0;";
    texto.innerHTML = "<div style=\"display:flex;align-items:center;gap:8px;margin-bottom:3px;\"><span style=\"font-size:16px;\">😩</span><strong style=\"color:#6f95ff;font-size:14px;\">Cansado de los anuncios?</strong></div><p style=\"color:#9aa3c7;font-size:11px;margin:0;line-height:1.3;\">Apoya Digital Knight para una experiencia sin anuncios</p>";

    const boton = document.createElement("a");
    boton.href = "/premium.html";
    boton.textContent = "Hazte Premium";
    boton.style.cssText = "background:linear-gradient(135deg,#007dff,#4358ff);color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap;flex-shrink:0;box-shadow:0 4px 14px rgba(0,120,255,0.35);";

    banner.appendChild(texto);
    banner.appendChild(boton);
    return banner;
  }

  function inicializar() {
    if (esPremium()) return;
    if (esPaginaExcluida()) return;
    const banner = crearBanner();
    if (banner) document.body.appendChild(banner);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }

  window.DK_ADS = { esPremium: esPremium };
})();