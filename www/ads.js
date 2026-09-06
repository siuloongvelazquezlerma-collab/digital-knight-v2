// =========================================================
// Sistema de Anuncios Digital Knight (ads.js)
// =========================================================
// Anuncios que SOLO ven los usuarios NO premium:
//   1) Video preroll antes de peliculas/series
//   2) Banner "Hazte Premium" abajo de la pagina
//   3) Anuncios propios (auto promocion)
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

  function mostrarVideoPreroll(callback) {
    if (esPremium()) { if (callback) callback(); return; }
    if (typeof document === 'undefined') { if (callback) callback(); return; }

    const video = AD_CONFIG.videos[indiceVideo % AD_CONFIG.videos.length];
    indiceVideo++;

    const overlay = document.createElement('div');
    overlay.id = 'dk-video-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;';

    const contador = document.createElement('div');
    contador.style.cssText = 'position:absolute;top:20px;right:20px;color:#fff;font-size:18px;background:rgba(0,0,0,0.7);padding:8px 16px;border-radius:20px;';
    contador.textContent = 'Anuncio... 5s';

    const videoEl = document.createElement('video');
    videoEl.src = video;
    videoEl.autoplay = true;
    videoEl.muted = false;
    videoEl.controls = false;
    videoEl.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    videoEl.onerror = cerrar;

    function cerrar() {
      overlay.remove();
      document.body.style.overflow = '';
      if (callback) callback();
    }

    let seg = 5;
    const timer = setInterval(() => {
      seg--;
      contador.textContent = 'Anuncio... ' + seg + 's';
      if (seg <= 0) { clearInterval(timer); cerrar(); }
    }, 1000);

    videoEl.onended = function() { clearInterval(timer); cerrar(); };

    overlay.appendChild(videoEl);
    overlay.appendChild(contador);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function crearBannerPremium() {
    if (esPremium()) return null;
    if (typeof document === 'undefined') return null;

    const banner = document.createElement('div');
    banner.id = 'dk-banner-premium';
    banner.style.cssText = 'width:100%;background:linear-gradient(135deg,#e94560,#0f3460);color:#fff;padding:12px 20px;text-align:center;font-size:14px;position:fixed;bottom:0;left:0;z-index:999999;box-shadow:0 -4px 20px rgba(0,0,0,0.5);';
    banner.innerHTML = '<strong>Hazte Premium</strong> y disfruta sin anuncios - <a href="/premium.html" style="color:#fff;text-decoration:underline;font-weight:bold;">Ver planes</a>';
    return banner;
  }

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
    const banner = crearBannerPremium();
    if (banner) document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.DK_ADS = { mostrarVideoPreroll: mostrarVideoPreroll, esPremium: esPremium };
})();