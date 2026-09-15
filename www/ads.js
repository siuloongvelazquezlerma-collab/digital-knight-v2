(function(){
  "use strict";
  // =====================================================
  // ANUNCIOS DESDE OPENDRIVE (no consumen MB de Vercel)
  // Pega aqui tus links directos od.lk cuando los subas.
  // Ejemplo: "https://od.lk/s/XXXXX/video1.mp4"
  // =====================================================
  var videos = ["https://od.lk/s/M18zMzYxODA4ODlfdzNpNnk/video1.mp4","https://od.lk/s/M18zMzYxODA4ODdfMDJrRmE/video2.mp4","https://od.lk/s/M18zMzU3NTA0NjNfOWxDOEw/anuncio%20TV%20r_%20m%C3%B3bil%202026.mp4"];
  var imgs = [{src:"https://od.lk/s/M18zMzYxODA4ODhfRUhpTnA/imagen1.png",titulo:"Digital Knight Premium",desc:"Sin anuncios y contenido exclusivo",link:"/premium.html"},{src:"https://od.lk/s/M18zMzYxODA4OTBfUDlEOUU/imagen2.png",titulo:"Digital Knight Premium",desc:"Sin anuncios y contenido exclusivo",link:"/premium.html"},{src:"https://od.lk/s/M18zMzYxODA4ODZfMTd2SW0/imagen3.png",titulo:"Digital Knight Premium",desc:"Sin anuncios y contenido exclusivo",link:"/premium.html"}];
  var vistosV = [], vistosI = [];
  function esLinkValido(u){return typeof u==="string"&&u.indexOf("http")===0}
  function getVideo(){
    var validos=[];
    for(var i=0;i<videos.length;i++){if(esLinkValido(videos[i])&&vistosV.indexOf(i)===-1)validos.push(i)}
    if(!validos.length){vistosV=[];for(var j=0;j<videos.length;j++){if(esLinkValido(videos[j]))validos.push(j)}}
    if(!validos.length)return null;
    var e = validos[Math.floor(Math.random()*validos.length)];
    vistosV.push(e);
    return videos[e];
  }
  function getImg(){
    var validos=[];
    for(var i=0;i<imgs.length;i++){if(imgs[i]&&esLinkValido(imgs[i].src)&&vistosI.indexOf(i)===-1)validos.push(i)}
    if(!validos.length){vistosI=[];for(var j=0;j<imgs.length;j++){if(imgs[j]&&esLinkValido(imgs[j].src))validos.push(j)}}
    if(!validos.length)return null;
    var e = validos[Math.floor(Math.random()*validos.length)];
    vistosI.push(e);
    return imgs[e];
  }
  function esPremium(){
    try{var p=JSON.parse(localStorage.getItem("dk_profile")||"{}");return p.premium===true}catch(e){return false}
  }
  function enReproduccion(){
    try{
      // 1) Si hay un <video> principal reproduciendo -> estamos en reproduccion
      var vs=document.querySelectorAll("video");
      for(var i=0;i<vs.length;i++){
        var v=vs[i];
        // ignora el video del propio anuncio
        if(v.closest && v.closest("#vd"))continue;
        if(!v.paused && !v.ended && v.currentTime>0)return true;
      }
      // 2) Paginas player: #player visible y #cover oculto = reproduciendo
      var player=document.getElementById("player");
      var cover=document.getElementById("cover");
      if(player){
        var dp="";
        try{dp=window.getComputedStyle(player).display}catch(e){dp=player.style.display||""}
        if(dp!=="none" && player.style.display!=="none"){
          if(!cover)return true;
          var dc="";
          try{dc=window.getComputedStyle(cover).display}catch(e){dc=cover.style.display||""}
          if(dc==="none"||cover.style.display==="none")return true;
        }
      }
      // 3) Controles del reproductor visibles a pantalla completa
      if(document.getElementById("controls") && document.querySelector(".player") && document.fullscreenElement)return true;
    }catch(e){}
    return false;
  }
  function esExcluida(){
    var p=window.location.pathname.toLowerCase();
    var ex=["/index.html","/premium.html","/perfil-2026.html","/perfil digital knight 2025.html","/perfil2025.html","/perfil-old.html","/perfil test.html","/perfil dragon ball 2025.html","/new search page 2025.html","/search.html","/buscar.html","/manage-premium.html"];
    return ex.some(function(x){return p.includes(x.replace(".html",""))});
  }
  function banner(){
    if(esPremium()||esExcluida()||typeof document==="undefined")return null;
    var b=document.createElement("div");
    b.id="dk-banner-premium";
    // z-index bajo para que quede DEBAJO del reproductor, X grande abajo para cerrar manual
    b.style.cssText="position:fixed;bottom:120px;left:12px;right:12px;background:linear-gradient(135deg,#01011d,#05051d);border:1px solid rgba(0,125,255,.3);border-radius:14px;padding:12px 40px 12px 16px;z-index:1000;display:flex;align-items:center;gap:12px;font-family:system-ui,sans-serif;";
    var t=document.createElement("div");
    t.innerHTML='<span style="color:#6f95ff;font-size:13px;">&#128557; Cansado de anuncios?</span><br><small style="color:#999;">Apoya Digital Knight</small>';
    var a=document.createElement("a");
    a.href="/premium.html";
    a.textContent="Premium";
    a.style.cssText="background:#007dff;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;white-space:nowrap;";
    var x=document.createElement("button");
    x.id="dk-banner-x";
    x.textContent="X";
    x.setAttribute("aria-label","Cerrar anuncio");
    x.style.cssText="position:absolute;bottom:8px;right:8px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;font-size:15px;font-weight:bold;cursor:pointer;line-height:1;";
    b.appendChild(t);b.appendChild(a);b.appendChild(x);
    x.onclick=function(ev){if(ev&&ev.stopPropagation)ev.stopPropagation();clearInterval(cheq);b.remove()};
    // se oculta solo cuando empieza la reproduccion
    var cheq=setInterval(function(){
      if(enReproduccion()){try{b.style.display="none"}catch(e){}}
      else{if(document.getElementById("dk-banner-premium")){try{b.style.display="flex"}catch(e){}}else{clearInterval(cheq)}}
    },1000);
    return b;
  }
  function videoAd(){
    if(esPremium()||enReproduccion()||document.getElementById("vd")||document.getElementById("im"))return;
    var vs=getVideo();
    if(!vs)return; // aun no hay links de OpenDrive pegados -> no mostrar nada roto
    var o=document.createElement("div");
    o.id="vd";
    o.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:2147483602;";
    o.innerHTML='<video src="'+vs+'" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;"></video><span id="vdt" style="position:absolute;top:12px;left:12px;color:#fff;background:rgba(0,0,0,.7);padding:8px 14px;border-radius:20px;font-size:13px;">5s</span><button id="vdc" style="position:absolute;bottom:48px;right:16px;width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.75);color:#fff;border:1px solid rgba(255,255,255,.4);font-size:18px;font-weight:bold;pointer-events:none;opacity:.4;cursor:pointer;">X</button>';
    document.body.appendChild(o);
    var s=5,ti=document.getElementById("vdt"),cb=document.getElementById("vdc"),iv=setInterval(function(){s--;if(s>0){ti.textContent=s+"s"}else{ti.style.display="none";cb.style.pointerEvents="auto";cb.style.opacity="1";clearInterval(iv)}},1000);
    cb.onclick=function(){clearInterval(iv);o.remove()};
    document.querySelector("#vd video").onended=function(){clearInterval(iv);o.remove()};
  }
  // NUNCA simultaneos: si hay uno abierto, no se abre el otro
  function imgAd(){
    if(esPremium()||enReproduccion()||document.getElementById("im")||document.getElementById("vd"))return;
    var im=getImg();
    if(!im)return; // aun no hay links de OpenDrive pegados -> no mostrar nada roto
    var o=document.createElement("div");
    o.id="im";
    o.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(#01011d,#05051d);z-index:2147483602;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;";
    o.innerHTML='<button id="imc" style="position:absolute;bottom:48px;right:16px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.4);font-size:18px;font-weight:bold;cursor:pointer;">X</button><img src="'+im.src+'" style="max-width:100%;max-height:50vh;border-radius:12px;"><h2 style="color:#fff;margin:16px 0 8px;">'+im.titulo+'</h2><p style="color:#999;font-size:14px;text-align:center;max-width:300px;">'+im.desc+'</p><a href="'+im.link+'" style="margin-top:16px;margin-bottom:80px;padding:12px 32px;background:linear-gradient(#007dff,#4358ff);color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;">Ver Mas</a>';
    document.body.appendChild(o);
    document.getElementById("imc").onclick=function(){o.remove()};
  }
  // INTERCALADO: imagen (5 min) -> video (8 min) -> imagen -> video...
  var turnoVideo=false; // false=toca imagen, true=toca video
  function siguienteAd(){
    if(esPremium()||esExcluida())return;
    if(enReproduccion()){programarSiguiente(60000);return} // si reproduce, reintenta en 1 min
    if(document.getElementById("vd")||document.getElementById("im")){programarSiguiente(60000);return} // si hay uno abierto, reintenta en 1 min
    if(turnoVideo){videoAd()}else{imgAd()}
    turnoVideo=!turnoVideo; // alterna para la proxima
    // programa el siguiente segun lo que ACABA de mostrar: video->8min, imagen->5min
    programarSiguiente(turnoVideo?480000:300000);
  }
  function programarSiguiente(ms){
    setTimeout(function(){
      if(esPremium()||esExcluida())return;
      siguienteAd();
    },ms);
  }
  function randomAd(){
    siguienteAd(); // compatibilidad: DK_ADS.randomAd() sigue funcionando
  }
  function init(){
    if(esPremium()||esExcluida())return;
    var bn=banner();
    if(bn)document.body.appendChild(bn);
    // primer anuncio: imagen a los 8s, luego se intercala solo (imagen 5min / video 8min)
    setTimeout(siguienteAd,8000);
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}
  window.DK_ADS={esPremium:esPremium,videoAd:videoAd,imgAd:imgAd,randomAd:randomAd};
})();
