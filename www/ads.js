(function(){
  "use strict";
  var videos = ["/anuncios/video1.mp4","/anuncios/video2.mp4","/anuncios/video3.mp4"];
  var imgs = [{src:"/anuncios/imagen1.jpg",titulo:"Anuncio 1",desc:"Descripcion",link:"#"},{src:"/anuncios/imagen2.jpg",titulo:"Anuncio 2",desc:"Descripcion",link:"#"}];
  var vistosV = [], vistosI = [];
  function getVideo(){
    if(vistosV.length >= videos.length) vistosV = [];
    var disp = [];
    for(var i=0;i<videos.length;i++){if(vistosV.indexOf(i)===-1)disp.push(i)}
    var e = disp[Math.floor(Math.random()*disp.length)];
    vistosV.push(e);
    return videos[e];
  }
  function getImg(){
    if(vistosI.length >= imgs.length) vistosI = [];
    var disp = [];
    for(var i=0;i<imgs.length;i++){if(vistosI.indexOf(i)===-1)disp.push(i)}
    var e = disp[Math.floor(Math.random()*disp.length)];
    vistosI.push(e);
    return imgs[e];
  }
  function esPremium(){
    try{var p=JSON.parse(localStorage.getItem("dk_profile")||"{}");return p.premium===true}catch(e){return false}
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
    b.style.cssText="position:fixed;bottom:120px;left:12px;right:12px;background:linear-gradient(135deg,#01011d,#05051d);border:1px solid rgba(0,125,255,.3);border-radius:14px;padding:12px 16px;z-index:2147483600;display:flex;align-items:center;gap:12px;font-family:system-ui,sans-serif;";
    var t=document.createElement("div");
    t.innerHTML='<span style="color:#6f95ff;font-size:13px;">&#128557; Cansado de anuncios?</span><br><small style="color:#999;">Apoya Digital Knight</small>';
    var a=document.createElement("a");
    a.href="/premium.html";
    a.textContent="Premium";
    a.style.cssText="background:#007dff;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;";
    b.appendChild(t);b.appendChild(a);
    return b;
  }
  function videoAd(){
    if(esPremium()||document.getElementById("vd"))return;
    var vs=getVideo();
    var o=document.createElement("div");
    o.id="vd";
    o.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:2147483602;";
    o.innerHTML='<video src="'+vs+'" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;"></video><span id="vdt" style="position:absolute;top:12px;left:12px;color:#fff;background:rgba(0,0,0,.7);padding:8px 14px;border-radius:20px;font-size:13px;">5s</span><button id="vdc" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.7);color:#fff;border:none;padding:8px 14px;border-radius:20px;font-size:13px;pointer-events:none;opacity:.4;">X</button>';
    document.body.appendChild(o);
    var s=5,ti=document.getElementById("vdt"),cb=document.getElementById("vdc"),iv=setInterval(function(){s--;if(s>0){ti.textContent=s+"s"}else{ti.style.display="none";cb.style.pointerEvents="auto";cb.style.opacity="1";clearInterval(iv)}},1000);
    cb.onclick=function(){clearInterval(iv);o.remove()};
    document.querySelector("#vd video").onended=function(){clearInterval(iv);o.remove()};
  }
  function imgAd(){
    if(esPremium()||document.getElementById("im"))return;
    var im=getImg();
    var o=document.createElement("div");
    o.id="im";
    o.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(#01011d,#05051d);z-index:2147483602;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;";
    o.innerHTML='<button id="imc" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.1);color:#fff;border:none;padding:8px 14px;border-radius:20px;font-size:13px;">X</button><img src="'+im.src+'" style="max-width:100%;max-height:50vh;border-radius:12px;"><h2 style="color:#fff;margin:16px 0 8px;">'+im.titulo+'</h2><p style="color:#999;font-size:14px;text-align:center;max-width:300px;">'+im.desc+'</p><a href="'+im.link+'" style="margin-top:16px;padding:12px 32px;background:linear-gradient(#007dff,#4358ff);color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;">Ver Mas</a>';
    document.body.appendChild(o);
    document.getElementById("imc").onclick=function(){o.remove()};
  }
  function randomAd(){
    if(esPremium()||esExcluida())return;
    var r=Math.random();
    if(r<0.4)videoAd();
    else if(r<0.8)imgAd();
  }
  function init(){
    if(esPremium()||esExcluida())return;
    var bn=banner();
    if(bn)document.body.appendChild(bn);
    setTimeout(randomAd,8000);
    setInterval(randomAd,240000+Math.floor(Math.random()*120000));
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}
  window.DK_ADS={esPremium:esPremium,videoAd:videoAd,imgAd:imgAd,randomAd:randomAd};
})();
