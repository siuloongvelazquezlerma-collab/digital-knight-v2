// =========================================================
// Sistema de Anuncios Digital Knight (ads.js)
// =========================================================
// Anuncios que SOLO ven los usuarios NO premium:
//   1) Banner "Hazte Premium" abajo de todo
//   2) Videos que aparecen al entrar a peliculas/series (no siempre)
//   3) Anuncios propios (auto-promocion)
// Todo se oculta automaticamente si el usuario es premium.
// =========================================================

(function () {
  'use strict';

  const AD_CONFIG = {
    videos: [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    ],
    propios: [
      { imagen: 'https://via.placeholder.com/300x250/1a1a2e/e94560?text=Digital+Knight+Premium', titulo: 'Hazte Premium', descripcion: 'Sin anuncios, sin limites', link: '/premium.html' },
      { imagen: 'https://via.placeholder.com/300x250/16213e/0f3460?text=Descarga+la+App', titulo: 'Descarga la App', descripcion: 'Disponible en Android', link: '#' }
    ]
  };

  let indiceVideo = 0;
  let indicePropio = 0;

  function esPremium() {
    try {
      const p = JSON.parse(localStorage.getItem('dk_profile') || '{}');
      return p.premium === true;
    } catch (e) {
      return false;
    }
  }

  // Detecta si estamos en pagina de peliculas o series
  function esPaginaContenido() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('/peliculas') || path.includes('/series') ||
           path.includes('peliculas') || path.includes('series');
  }

  // Video anuncio (overlay completo, se puede cerrar)
  function mostrarVideoAnuncio() {
    if (esPremium()) return;
    if (typeof document === 'undefined') return;

    const video = AD_CONFIG.videos[indiceVideo % AD_CONFIG.videos.length];
    indiceVideo++;

    const overlay = document.createElement('div');
    overlay.id = 'dk-video-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:2147483647;display:flex;align-items:center;justify-content:center;flex-direction:column;';

    const cerrarBtn = document.createElement('button');
    cerrarBtn.textContent = '✕ Cerrar';
    cerrarBtn.style.cssText = 'position:absolute;top:15px;right:15px;color:#fff;font-size:16px;background:#e94560;border:none;border-radius:4px;padding:8px 14px;cursor:pointer;z-index:2147483647;';
    cerrarBtn.onclick = () => { overlay.remove(); document.body.style.overflow = ''; };

    const videoEl = document.createElement('video');
    videoEl.src = video;
    videoEl.autoplay = true;
    videoEl.muted = false;
    videoEl.controls = true;
    videoEl.playsInline = true;
    videoEl.style.cssText = 'width:90%;max-width:600px;max-height:70%;';
    videoEl.onerror = () => { overlay.remove(); document.body.style.overflow = ''; };

    overlay.appendChild(videoEl);
    overlay.appendChild(cerrarBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); }
    });
  }

  // Banner "Hazte Premium" - siempre visible arriba de la nav del celular
  function crearBannerPremium() {
    if (esPremium()) return null;
    if (typeof document === 'undefined') return null;

    const banner = document.createElement('div');
    banner.id = 'dk-banner-premium';
    banner.style.cssText = 'position:fixed;bottom:62px;left:0;width:100%;background:linear-gradient(135deg,#e94560,#0f3460);color:#fff;padding:10px 16px;text-align:center;font-size:13px;z-index:2147483647;box-shadow:0 -2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;gap:8px;';
    banner.innerHTML = '<span>⭐ <strong>Hazte Premium</strong> y disfruta sin anuncios</span> <a href="/premium.html" style="background:#fff;color:#e94560;padding:6px 12px;border-radius:4px;text-decoration:none;font-weight:bold;">Ver planes</a>';
    return banner;
  }

  // Anuncio propio (imagen + texto)
  function crearAnuncioPropio() {
    if (esPremium()) return null;
    const anuncio = AD_CONFIG.propios[indicePropio % AD_CONFIG.propios.length];
    indicePropio++;
    const div = document.createElement('div');
    div.className = 'dk-anuncio-propio';
    div.style.cssText = 'background:#1a1a2e;border:1px solid #e94560;border-radius:8px;padding:12px;margin:16px 0;text-align:center;';
    div.innerHTML = '<a href="' + anuncio.link + '" style="text-decoration:none;color:#fff;"><img src="' + anuncio.imagen + '" style="width:100%;max-width:250px;border-radius:4px;"><div style="font-weight:bold;margin-top:6px;">' + anuncio.titulo + '</div><div style="font-size:12px;color:#aaa;">' + anuncio.descripcion + '</div></a>';
    return div;
  }

  function inicializar() {
    if (esPremium()) return;

    // Banner abajo (siempre visible, arriba de la nav del celular)
    const banner = crearBannerPremium();
    if (banner) document.body.appendChild(banner);

    // Video anuncio al entrar (solo en paginas de contenido, no siempre)
    if (esPaginaContenido() && Math.random() < 0.5) {
      setTimeout(mostrarVideoAnuncio, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.DK_ADS = { mostrarVideoAnuncio: mostrarVideoAnuncio, esPremium: esPremium };
})();