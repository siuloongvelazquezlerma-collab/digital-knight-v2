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
    // 1. Leer premium de la caché y refrescar contra Supabase
    await dkRefrescarPerfil();

    // 2. Premium -> nada de anuncios, fin
    if(dkEsPremium()) return;

    // 3. No premium -> cargar anuncios (excepto en reproductores)
    if(esPaginaReproductor()) return;

    cargarRed();        // 1) red de anuncios (si está configurada)
    mostrarSelfPromo(); // 2) anuncio propio
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciarAds);
  } else {
    iniciarAds();
  }

})();
