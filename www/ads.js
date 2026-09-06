// =========================================================
// 💰 DIGITAL KNIGHT · SISTEMA DE ANUNCIOS WEB (ads.js)
// =========================================================
// Dos fuentes de anuncios, ambas SOLO para usuarios NO premium:
//
//   1) RED DE ANUNCIOS (ej. Monetag)  -> pega tu zone URL en
//      AD_CONFIG.network.zoneUrl cuando la tengas.
//
//   2) AUTO PROMOCIÓN (anuncio propio -> premium.html)
//      Funciona desde ya, sin registrar nada.
//
// Uso en cualquier página HTML:
//   <script src="/ads.js" defer></script>
//
// El usuario premium NUNCA carga ningún anuncio.
// =========================================================

(function () {

  // ------------------------------------------------------
  // ⚙️ CONFIGURACIÓN (edita solo esto)
  // ------------------------------------------------------
  const AD_CONFIG = {

    // 1) Red de anuncios (Monetag, Adsterra, etc.)
    network: {
      enabled: false,                 // cambia a true cuando tengas tu zone
      zoneUrl: "",                    // ej: "https://tu-red.com/tag.js?zone=1234567"
    },

    // 2) Anuncio propio de autopromoción (banner fijo abajo)
    selfPromo: {
      enabled: true,
      titulo: "⭐ Quita los anuncios",
      texto: "Disfruta Digital Knight sin anuncios y con descargas. Hazte Premium por $40 MXN/mes.",
      boton: "Hazte Premium",
      url: "premium.html",
      // cada cuánto vuelve a aparecer tras cerrarlo (horas). 0 = siempre
      recordatorioHoras: 12
    },

    // 3) ANUNCIO EN VIDEO a pantalla completa (intersticial propio)
    //    videos: lista de links .mp4 (tuyos o de patrocinadores).
    //    Se elige uno al azar. Se puede cerrar tras 'segundosAntesCerrar'.
    videoAd: {
      enabled: true,
      videos: [
        // ⬇️ PEGA AQUÍ TUS LINKS DE VIDEO (mp4). Ejemplo:
        // "https://od.lk/d/xxxxx/mi-promo.mp4",
      ],
      segundosAntesCerrar: 5,   // el ✕ aparece después de estos segundos
      frecuenciaHoras: 6        // cada cuánto puede volver a salir
    }
  };

  // ------------------------------------------------------
  // ⭐ ESTADO PREMIUM (igual que en los players)
  // ------------------------------------------------------
  const DK_SB_URL = 'https://wplyrhcszuoordgaphax.supabase.co';
  const DK_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU';

  function dkEsPremium(){
    try{
      const p = JSON.parse(localStorage.getItem('dk_profile') || '{}');
      if(!p.premium) return false;
      if(p.premium_until && new Date(p.premium_until) < new Date()) return false;
      return true;
    }catch(e){ return false; }
  }

  async function dkRefrescarPerfil(){
    try{
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
      const sb = createClient(DK_SB_URL, DK_SB_KEY);
      const { data } = await sb.auth.getSession();
      if(data.session){
        const { data: fresh } = await sb.from('profiles')
          .select('premium, premium_until, devices_limit')
          .eq('id', data.session.user.id).maybeSingle();
        if(fresh){
          const old = JSON.parse(localStorage.getItem('dk_profile') || '{}');
          localStorage.setItem('dk_profile', JSON.stringify({ ...old, ...fresh }));
        }
      }
    }catch(e){ /* silencioso: los anuncios no son críticos */ }
  }

  // ------------------------------------------------------
  // 🚫 No mostrar anuncios en páginas del reproductor
  // ------------------------------------------------------
  function esPaginaReproductor(){
    const ruta = location.pathname.toLowerCase();
    return ruta.includes('/peliculas/') ||
           ruta.includes('/series/') ||
           ruta.includes('player') ||
           !!document.querySelector('video');
  }

  // ------------------------------------------------------
  // 2) ANUNCIO PROPIO (autopromoción)
  // ------------------------------------------------------
  function puedeMostrarSelfPromo(){
    if(AD_CONFIG.selfPromo.recordatorioHoras <= 0) return true;
    const last = Number(localStorage.getItem('dk_ad_closed_at') || 0);
    const horas = (Date.now() - last) / 1000 / 60 / 60;
    return horas >= AD_CONFIG.selfPromo.recordatorioHoras;
  }

  function mostrarSelfPromo(){
    if(!AD_CONFIG.selfPromo.enabled) return;
    if(!puedeMostrarSelfPromo()) return;

    const banner = document.createElement('div');
    banner.id = 'dk-self-ad';
    banner.innerHTML = `
      <style>
        #dk-self-ad{
          position:fixed; left:12px; right:12px; bottom:12px; z-index:99990;
          background:linear-gradient(135deg,rgba(5,8,30,.97),rgba(10,20,60,.97));
          border:1px solid rgba(0,125,255,.45);
          border-radius:16px; padding:14px 40px 14px 16px;
          display:flex; align-items:center; gap:12px;
          box-shadow:0 12px 32px rgba(0,0,0,.6), 0 0 24px rgba(0,120,255,.15);
          font-family:'Segoe UI',system-ui,sans-serif; color:#eef1ff;
          animation:dkAdIn .45s ease;
        }
        @keyframes dkAdIn{from{transform:translateY(120%);opacity:0}to{transform:none;opacity:1}}
        #dk-self-ad .dk-ad-icon{font-size:26px}
        #dk-self-ad .dk-ad-body{flex:1;min-width:0}
        #dk-self-ad .dk-ad-title{font-size:14px;font-weight:800;margin-bottom:2px}
        #dk-self-ad .dk-ad-text{font-size:12px;color:#9fd9ff;line-height:1.4}
        #dk-self-ad .dk-ad-btn{
          flex-shrink:0; background:linear-gradient(135deg,#007dff,#4358ff);
          color:#fff; border:none; border-radius:10px; padding:10px 14px;
          font-size:13px; font-weight:800; cursor:pointer; white-space:nowrap;
          transition:.2s;
        }
        #dk-self-ad .dk-ad-btn:hover{filter:brightness(1.15)}
        #dk-self-ad .dk-ad-close{
          position:absolute; top:8px; right:10px; width:24px; height:24px;
          border-radius:50%; border:1px solid rgba(255,255,255,.25);
          background:transparent; color:#9aa3c7; font-size:14px;
          cursor:pointer; line-height:1;
        }
        #dk-self-ad .dk-ad-close:hover{color:#fff;border-color:#fff}
        @media (max-width:520px){
          #dk-self-ad .dk-ad-text{display:none}
          #dk-self-ad .dk-ad-btn{padding:9px 12px}
        }
      </style>
      <div class="dk-ad-icon">🎬</div>
      <div class="dk-ad-body">
        <div class="dk-ad-title">${AD_CONFIG.selfPromo.titulo}</div>
        <div class="dk-ad-text">${AD_CONFIG.selfPromo.texto}</div>
      </div>
      <button class="dk-ad-btn" onclick="location.href='${AD_CONFIG.selfPromo.url}'">
        ${AD_CONFIG.selfPromo.boton}
      </button>
      <button class="dk-ad-close" id="dkAdClose" title="Cerrar">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('dkAdClose').onclick = () => {
      banner.remove();
      localStorage.setItem('dk_ad_closed_at', String(Date.now()));
    };
  }

  // ------------------------------------------------------
  // 🧹 LIMPIEZA: dar de baja el Service Worker de Monetag
  // (el sitio fue rechazado; el SW ya no debe interceptar nada)
  // ------------------------------------------------------
  async function limpiarServiceWorkers(){
    try{
      if(!('serviceWorker' in navigator)) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      for(const reg of regs){
        const url = reg.active?.scriptURL || reg.installing?.scriptURL || '';
        if(url.includes('5gvci.com') || url.includes('monetag') || /\/sw\.js/.test(url)){
          await reg.unregister();
          console.log('[dk-ads] Service Worker de anuncios dado de baja:', url);
        }
      }
    }catch(e){ /* silencioso */ }
  }

  // ------------------------------------------------------
  // 3) ANUNCIO EN VIDEO a pantalla completa (intersticial)
  // ------------------------------------------------------
  function puedeMostrarVideoAd(){
    if(!AD_CONFIG.videoAd.videos.length) return false;
    if(AD_CONFIG.videoAd.frecuenciaHoras <= 0) return true;
    const last = Number(localStorage.getItem('dk_videoad_at') || 0);
    const horas = (Date.now() - last) / 1000 / 60 / 60;
    return horas >= AD_CONFIG.videoAd.frecuenciaHoras;
  }

  function mostrarVideoAd(){
    if(!AD_CONFIG.videoAd.enabled) return;
    if(!puedeMostrarVideoAd()) return;

    const src = AD_CONFIG.videoAd.videos[
      Math.floor(Math.random() * AD_CONFIG.videoAd.videos.length)
    ];

    const overlay = document.createElement('div');
    overlay.id = 'dk-video-ad';
    overlay.innerHTML = `
      <style>
        #dk-video-ad{
          position:fixed; inset:0; z-index:99999;
          background:#000; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-family:'Segoe UI',system-ui,sans-serif;
        }
        #dk-video-ad video{
          width:100%; height:100%; object-fit:contain; background:#000;
        }
        #dk-video-ad .dk-va-top{
          position:absolute; top:0; left:0; right:0;
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 14px;
          background:linear-gradient(180deg,rgba(0,0,0,.8),transparent);
        }
        #dk-video-ad .dk-va-label{
          color:#9fd9ff; font-size:12px; font-weight:700; letter-spacing:1px;
        }
        #dk-video-ad .dk-va-close{
          display:none; align-items:center; gap:8px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(255,255,255,.35); color:#fff;
          border-radius:20px; padding:7px 14px; font-size:13px; font-weight:700;
          cursor:pointer; transition:.2s;
        }
        #dk-video-ad .dk-va-close:hover{background:rgba(255,255,255,.25)}
        #dk-video-ad .dk-va-close.visible{display:flex}
        #dk-video-ad .dk-va-bottom{
          position:absolute; bottom:0; left:0; right:0;
          display:flex; flex-direction:column; align-items:center; gap:8px;
          padding:18px 14px;
          background:linear-gradient(0deg,rgba(0,0,0,.85),transparent);
        }
        #dk-video-ad .dk-va-cta{
          background:linear-gradient(135deg,#007dff,#4358ff);
          color:#fff; border:none; border-radius:10px; padding:11px 18px;
          font-size:14px; font-weight:800; cursor:pointer; transition:.2s;
        }
        #dk-video-ad .dk-va-cta:hover{filter:brightness(1.15)}
      </style>
      <div class="dk-va-top">
        <span class="dk-va-label">ANUNCIO · DIGITAL KNIGHT</span>
        <button class="dk-va-close" id="dkVaClose">
          Cerrar en <span id="dkVaCount">5</span>s
        </button>
      </div>
      <video id="dkVaVideo" src="${src}" autoplay muted playsinline></video>
      <div class="dk-va-bottom">
        <button class="dk-va-cta" onclick="location.href='premium.html'">
          ⭐ Quita los anuncios · Hazte Premium
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    localStorage.setItem('dk_videoad_at', String(Date.now()));

    const video = overlay.querySelector('#dkVaVideo');
    const closeBtn = overlay.querySelector('#dkVaClose');
    let restantes = AD_CONFIG.videoAd.segundosAntesCerrar;
    closeBtn.querySelector('#dkVaCount').textContent = restantes;

    // Cuenta regresiva para habilitar el ✕
    const timer = setInterval(() => {
      restantes--;
      if(restantes <= 0){
        clearInterval(timer);
        closeBtn.querySelector('#dkVaCount').textContent = '0';
        closeBtn.classList.add('visible');
        closeBtn.innerHTML = 'Cerrar ✕';
        closeBtn.onclick = () => overlay.remove();
      } else {
        closeBtn.querySelector('#dkVaCount').textContent = restantes;
      }
    }, 1000);

    // Si el video termina antes, cerrar de inmediato
    video.addEventListener('ended', () => {
      clearInterval(timer);
      overlay.remove();
    });

    // Por si el video no carga, no dejar la pantalla en negro más de 10s
    video.addEventListener('error', () => {
      clearInterval(timer);
      overlay.remove();
    });
  }

  // ------------------------------------------------------
  // 1) RED DE ANUNCIOS (Monetag, etc.)
  // ------------------------------------------------------
  function cargarRed(){
    if(!AD_CONFIG.network.enabled) return;
    if(!AD_CONFIG.network.zoneUrl){
      console.warn('[dk-ads] network.enabled=true pero falta zoneUrl en ads.js');
      return;
    }
    const s = document.createElement('script');
    s.src = AD_CONFIG.network.zoneUrl;
    s.async = true;
    s.dataset.sdk = 'dk-ads-network';
    document.body.appendChild(s);
  }

  // ------------------------------------------------------
  // 🚀 ARRANQUE
  // ------------------------------------------------------
  async function iniciarAds(){
    // 0. Limpiar Service Workers viejos (Monetag)
    limpiarServiceWorkers();

    // 1. Leer premium de la caché y refrescar contra Supabase
    await dkRefrescarPerfil();

    // 2. Premium -> nada de anuncios, fin
    if(dkEsPremium()) return;

    // 3. No premium -> cargar anuncios (excepto en reproductores)
    if(esPaginaReproductor()) return;

    // 4. Video intersticial tiene prioridad; si no toca, banner propio
    if(AD_CONFIG.videoAd.enabled && AD_CONFIG.videoAd.videos.length && puedeMostrarVideoAd()){
      mostrarVideoAd();
    } else {
      mostrarSelfPromo();
    }

    // La red externa quedó desactivada (sitio rechazado por políticas)
    // cargarRed(); // <- dejar comentado
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciarAds);
  } else {
    iniciarAds();
  }

})();
