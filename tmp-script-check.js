var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// www/js/supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
var supabase;
var init_supabaseClient = __esm({
  "www/js/supabaseClient.js"() {
    supabase = createClient(
      "https://wplyrhcszuoordgaphax.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );
  }
});

// www/js/sync-supabase.js
function clearUserProfileFromLocalStorage() {
  localStorage.removeItem("profileAvatar");
  localStorage.removeItem("profileName");
  localStorage.removeItem("profileCover");
}
async function saveProfileToSupabase() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;
    const email = session.user.email;
    const avatar = localStorage.getItem("profileAvatar") || null;
    const userName = localStorage.getItem("profileName") || "Usuario";
    const background = localStorage.getItem("profileCover") || null;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      user_name: userName,
      avatar,
      background
    });
    if (error) {
      console.error("\u274C Error guardando perfil:", error);
    } else {
      console.log("\u2705 Perfil sincronizado");
    }
  } catch (e) {
    console.error("\u274C Error:", e);
  }
}
function getHiddenList() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
  } catch (_) {
    return [];
  }
}
function hideFromContinueWatching(supabaseId) {
  if (!supabaseId) return;
  const list = getHiddenList();
  if (!list.includes(supabaseId)) {
    list.push(supabaseId);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(list));
  }
}
async function deleteAllProgressFromSupabase() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const userId = session.user.id;
    const { data: deletedProgresos, error: progresosError } = await supabase.from("progresos").delete().eq("id", userId).select();
    if (progresosError) {
      console.error("\u274C Error borrando progresos (revisa pol\xEDticas RLS):", progresosError);
    } else {
      console.log(`\u{1F5D1}\uFE0F ${deletedProgresos?.length ?? 0} filas borradas de 'progresos'`);
    }
    try {
      const { error: viewsError } = await supabase.from("user_views").delete().eq("user_id", userId);
      if (viewsError && !/does not exist|42P01/i.test(viewsError.message || "")) {
        console.error("\u274C Error borrando vistas:", viewsError);
      }
    } catch (_) {
    }
    console.log("\u2705 Todo el progreso de Supabase borrado para usuario:", userId);
    return true;
  } catch (e) {
    console.error("\u274C Error:", e);
    return false;
  }
}
function isMovieCompleted(movieId) {
  const progress = parseFloat(localStorage.getItem(`progress_${movieId}`)) || 0;
  const duration = parseFloat(localStorage.getItem(`duration_${movieId}`)) || 0;
  if (!duration || duration <= 0) return false;
  return progress >= duration * 0.9;
}
function isSeriesCompleted(seriesId) {
  const itemData = JSON.parse(localStorage.getItem(`continue_${seriesId}`) || "{}");
  if (!itemData.progress || !itemData.duration) return false;
  return itemData.progress >= itemData.duration * 0.9;
}
var HIDDEN_KEY;
var init_sync_supabase = __esm({
  "www/js/sync-supabase.js"() {
    init_supabaseClient();
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        const lastUserId = localStorage.getItem("lastUserId");
        if (currentUserId && currentUserId !== lastUserId) {
          clearUserProfileFromLocalStorage();
          localStorage.setItem("lastUserId", currentUserId);
        }
      } catch (e) {
        console.warn("\u26A0\uFE0F Error detectando usuario:", e);
      }
    })();
    HIDDEN_KEY = "dk_hidden_continue";
    window.saveProfileToSupabase = saveProfileToSupabase;
    window.deleteAllProgressFromSupabase = deleteAllProgressFromSupabase;
    window.isMovieCompleted = isMovieCompleted;
  }
});

// www/script.js
var require_script = __commonJS({
  "www/script.js"() {
    init_supabaseClient();
    init_sync_supabase();
    if (localStorage.getItem("mainImagesLoaded") === "true") {
      document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("img[loading='lazy']").forEach((img) => {
          img.removeAttribute("loading");
        });
      });
    }
    function initDiaDeMuertosOverlay() {
      let ofrendaLayer = document.getElementById("ofrendaLayer");
      if (!ofrendaLayer) {
        ofrendaLayer = document.createElement("div");
        ofrendaLayer.id = "ofrendaLayer";
        ofrendaLayer.setAttribute("aria-hidden", "true");
        document.body.appendChild(ofrendaLayer);
      }
      if (ofrendaLayer.dataset.ready === "true") return;
      ofrendaLayer.dataset.ready = "true";
      const count = window.innerWidth < 768 ? 14 : 22;
      const colors = ["#f4b942", "#f28c28", "#d95b2b", "#f5d67d", "#f7e7a1"];
      for (let i = 0; i < count; i++) {
        const petal = document.createElement("div");
        petal.className = "ofrenda-petal";
        petal.textContent = "\u2726";
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `${Math.random() * 100}%`;
        petal.style.fontSize = `${12 + Math.random() * 16}px`;
        petal.style.color = colors[Math.floor(Math.random() * colors.length)];
        petal.style.setProperty("--duration", `${9 + Math.random() * 12}s`);
        petal.style.setProperty("--delay", `${-Math.random() * 16}s`);
        ofrendaLayer.appendChild(petal);
      }
    }
    document.addEventListener("DOMContentLoaded", () => {
      initDiaDeMuertosOverlay();
      const images = document.querySelectorAll("img[loading='lazy']");
      let loadedCount = 0;
      images.forEach((img) => {
        img.addEventListener("load", () => {
          loadedCount++;
          if (loadedCount === images.length) {
            localStorage.setItem("mainImagesLoaded", "true");
          }
          img.removeAttribute("loading");
        }, { once: true });
      });
    });
    document.addEventListener("contextmenu", function(event) {
      event.preventDefault();
    });
    document.addEventListener("copy", function(event) {
      event.preventDefault();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "F12" || event.ctrlKey && event.shiftKey && event.key === "I" || event.ctrlKey && event.key === "U" || event.ctrlKey && event.key === "C") {
        event.preventDefault();
      }
    });
    function createUpdateModal() {
      if (document.getElementById("updateModalOverlay")) return;
      const overlay2 = document.createElement("div");
      overlay2.id = "updateModalOverlay";
      overlay2.innerHTML = `
    <style>
      #updateModalOverlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s ease;backdrop-filter:blur(8px)}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes progress{0%{width:0%}100%{width:100%}}
      .update-modal{background:linear-gradient(135deg,#0a0a2e 0%,#1a1a3e 100%);border-radius:24px;padding:30px 25px;width:90%;max-width:380px;text-align:center;animation:slideUp .4s ease;border:1px solid rgba(0,125,255,.3);box-shadow:0 20px 60px rgba(0,125,255,.2)}
      .update-modal-logo{width:80px;height:80px;border-radius:20px;margin-bottom:15px;animation:pulse 2s infinite;box-shadow:0 8px 30px rgba(0,125,255,.3)}
      .update-modal-title{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px}
      .update-modal-subtitle{font-size:13px;color:#9aa3c7;margin-bottom:20px;line-height:1.5}
      .update-modal-version{display:inline-block;background:linear-gradient(135deg,#007dff,#4358ff);color:#fff;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:700;margin-bottom:20px}
      .update-modal-btn{display:block;width:100%;background:linear-gradient(135deg,#007dff,#4358ff);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s}
      .update-modal-btn:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,125,255,.4)}
      .update-modal-btn:active{transform:scale(.98)}
      .update-modal-btn .progress-bar{position:absolute;top:0;left:0;bottom:0;background:rgba(255,255,255,.2);width:0%;transition:width .3s}
      .update-modal-btn .btn-text{position:relative;z-index:1}
      .update-modal-btn.downloading{pointer-events:none}
      .update-modal-btn.downloading .progress-bar{animation:progress 3s ease-in-out forwards}
      .update-modal-btn.install{background:linear-gradient(135deg,#00c853,#00e676)}
      .update-modal-close{display:block;margin-top:15px;color:#666;font-size:13px;cursor:pointer;background:none;border:none;width:100%;padding:8px}
      .update-modal-close:hover{color:#999}
      .update-modal-done{display:block;margin-top:10px;color:#007dff;font-size:13px;cursor:pointer;background:none;border:none;width:100%;padding:8px;font-weight:600}
      .update-modal-done:hover{color:#4358ff}
    </style>
    <div class="update-modal">
      <img class="update-modal-logo" src="logo-2025.png" alt="Digital Knight">
      <div class="update-modal-title">\xA1Nueva versi\xF3n disponible!</div>
      <div class="update-modal-subtitle">Actualizaci\xF3n disponible para seguir disfrutando de las nuevas mejoras y correcciones</div>
      <div class="update-modal-version">V1.3.7</div>
      <button class="update-modal-btn" id="updateDownloadBtn">
        <span class="progress-bar"></span>
        <span class="btn-text">\u2B07 Descargar APK</span>
      </button>
      <button class="update-modal-done" id="updateDoneBtn">\u2705 Ya actualic\xE9</button>
      <button class="update-modal-close" id="updateCloseBtn">M\xE1s tarde</button>
    </div>
  `;
      document.body.appendChild(overlay2);
      document.getElementById("updateCloseBtn").onclick = () => overlay2.remove();
      document.getElementById("updateDoneBtn").onclick = () => {
        localStorage.setItem("lastUpdateShown", CURRENT_VERSION);
        overlay2.remove();
      };
      document.getElementById("updateDownloadBtn").onclick = function() {
        const btn = this;
        const btnText = btn.querySelector(".btn-text");
        btn.classList.add("downloading");
        btnText.textContent = "\u23F3 Descargando...";
        setTimeout(() => {
          btn.classList.remove("downloading");
          btnText.textContent = "\u2705 Descarga iniciada";
          window.open("https://od.lk/d/M18zMzU5NTc2NjRfNmxVWGg/DK-V1.3.7.apk", "_blank");
          setTimeout(() => overlay2.remove(), 2e3);
        }, 3e3);
      };
    }
    window.showUpdateModal = createUpdateModal;
    var CURRENT_VERSION = "1.3.16";
    function checkForUpdateModal() {
      const lastShown = localStorage.getItem("lastUpdateShown");
      if (lastShown !== CURRENT_VERSION) {
        setTimeout(() => {
          showUpdateModal();
          localStorage.setItem("lastUpdateShown", CURRENT_VERSION);
        }, 2e3);
      }
    }
    document.addEventListener("DOMContentLoaded", checkForUpdateModal);
    document.addEventListener("dragstart", function(event) {
      event.preventDefault();
    });
    var swiperInstances = {};
    var tabs = document.querySelectorAll(".tab");
    var sections = document.querySelectorAll(".mySwiper");
    var overlay = document.getElementById("transitionOverlay");
    var sectionContents = document.querySelectorAll(".section-content");
    var menuToggles = document.querySelectorAll(".menu-toggle");
    var mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
    var menuAutoCloseTimer = null;
    var swipeStartX = null;
    var swipeStartY = null;
    var swipeCurrentOffset = 0;
    function clearMenuAutoCloseTimer() {
      if (menuAutoCloseTimer) {
        clearTimeout(menuAutoCloseTimer);
        menuAutoCloseTimer = null;
      }
    }
    function scheduleMenuAutoClose() {
      clearMenuAutoCloseTimer();
      const tabsContainer2 = document.querySelector(".tabs");
      if (!tabsContainer2 || !tabsContainer2.classList.contains("open")) return;
      menuAutoCloseTimer = setTimeout(() => {
        if (document.querySelector(".tabs")?.classList.contains("open")) {
          setMobileMenuState(false);
        }
      }, 5e3);
    }
    function setMobileMenuState(isOpen) {
      const tabsContainer2 = document.querySelector(".tabs");
      if (!tabsContainer2) return;
      clearMenuAutoCloseTimer();
      if (isOpen) {
        tabsContainer2.classList.remove("hidden");
        tabsContainer2.style.transition = "";
        tabsContainer2.style.transform = "";
        requestAnimationFrame(() => {
          tabsContainer2.classList.add("open");
        });
        scheduleMenuAutoClose();
      } else {
        tabsContainer2.classList.remove("open");
        tabsContainer2.style.transform = "";
        requestAnimationFrame(() => {
          tabsContainer2.classList.add("hidden");
        });
      }
      document.body.classList.toggle("menu-open", isOpen);
      mobileMenuBackdrop?.classList.toggle("visible", isOpen);
      menuToggles.forEach((toggle) => {
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Cerrar men\xFA" : "Abrir men\xFA");
      });
    }
    setMobileMenuState(false);
    var isDrawerMenuMode = () => window.matchMedia("(max-width: 1024px), (orientation: landscape)").matches;
    function attachSwipeToMenu() {
      const tabsContainer2 = document.querySelector(".tabs");
      if (!tabsContainer2) return;
      tabsContainer2.addEventListener("touchstart", (event) => {
        if (!tabsContainer2.classList.contains("open") || !isDrawerMenuMode()) return;
        const touch = event.touches[0];
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;
        swipeCurrentOffset = 0;
        tabsContainer2.style.transition = "none";
        scheduleMenuAutoClose();
      }, { passive: true });
      tabsContainer2.addEventListener("touchmove", (event) => {
        if (swipeStartX === null || !tabsContainer2.classList.contains("open") || !isDrawerMenuMode()) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - swipeStartX;
        const deltaY = Math.abs(touch.clientY - swipeStartY);
        if (deltaY > 22 && Math.abs(deltaX) < 20) return;
        if (deltaX < 0) {
          swipeCurrentOffset = Math.max(deltaX, -tabsContainer2.offsetWidth);
          tabsContainer2.style.transform = `translateX(${swipeCurrentOffset}px)`;
          scheduleMenuAutoClose();
        }
      }, { passive: true });
      tabsContainer2.addEventListener("touchend", () => {
        if (swipeCurrentOffset < -80) {
          setMobileMenuState(false);
        } else {
          tabsContainer2.style.transition = "";
          tabsContainer2.style.transform = "";
        }
        swipeStartX = null;
        swipeStartY = null;
        swipeCurrentOffset = 0;
        scheduleMenuAutoClose();
      }, { passive: true });
    }
    attachSwipeToMenu();
    function openComingSoonModal(featureName) {
      const existing = document.querySelector(".coming-soon-overlay");
      if (existing) existing.remove();
      const overlay2 = document.createElement("div");
      overlay2.className = "coming-soon-overlay";
      const title = featureName === "deportes" ? "Deportes" : "Canales";
      const emoji = featureName === "deportes" ? "\u{1F3C6}" : "\u{1F4FA}";
      const message = featureName === "deportes" ? "Estamos preparando una experiencia \xFAnica para partidos, res\xFAmenes y contenido deportivo para que llegue muy pronto." : "La gu\xEDa de canales est\xE1 en construcci\xF3n. Estamos afinando la experiencia para que llegue con m\xE1s estilo y m\xE1s contenido.";
      overlay2.innerHTML = `
    <div class="coming-soon-modal" role="dialog" aria-modal="true" aria-labelledby="comingSoonTitle">
      <button type="button" class="coming-soon-close-btn" aria-label="Cerrar">\xD7</button>
      <div class="coming-soon-badge">Pr\xF3ximamente</div>
      <div class="coming-soon-icon">${emoji}</div>
      <h3 id="comingSoonTitle">${title}</h3>
      <p>${message}</p>
    </div>
  `;
      overlay2.addEventListener("click", (event) => {
        if (event.target === overlay2) overlay2.remove();
      });
      const closeButton = overlay2.querySelector(".coming-soon-close-btn");
      closeButton.addEventListener("click", () => overlay2.remove());
      document.body.appendChild(overlay2);
      setMobileMenuState(false);
    }
    mobileMenuBackdrop?.addEventListener("click", () => setMobileMenuState(false));
    menuToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const isOpen = !document.querySelector(".tabs")?.classList.contains("open");
        setMobileMenuState(isOpen);
      });
    });
    document.querySelectorAll(".menu-category").forEach((item) => {
      item.addEventListener("click", (event) => {
        const feature = item.dataset.feature;
        const href = item.getAttribute("href");
        if (feature) {
          event.preventDefault();
          openComingSoonModal(feature);
          return;
        }
        if (href) {
          setMobileMenuState(false);
          return;
        }
        setMobileMenuState(false);
      });
    });
    async function cargarSwiperInicio() {
      console.log("\u{1F535} Cargando swiper-data.json...");
      try {
        const respuesta = await fetch("swiper-data.json");
        if (!respuesta.ok) {
          throw new Error("No se pudo cargar swiper-data.json");
        }
        const datos = await respuesta.json();
        console.log("\u{1F7E2} JSON cargado:", datos);
        const nombresConjuntos = Object.keys(datos);
        const STORAGE_CONJUNTO = "dk_swiper_conjunto";
        const STORAGE_TIEMPO = "dk_swiper_conjunto_time";
        const ahora = Date.now();
        let conjuntoElegido = localStorage.getItem(STORAGE_CONJUNTO);
        const tiempoGuardado = parseInt(
          localStorage.getItem(STORAGE_TIEMPO) || "0",
          10
        );
        const TREINTA_MINUTOS = 30 * 60 * 1e3;
        const conjuntosConEstreno = [];
        nombresConjuntos.forEach((nombreConjunto) => {
          const conjuntoActual = datos[nombreConjunto];
          if (!conjuntoActual) return;
          let tieneEstreno = false;
          Object.keys(conjuntoActual).forEach((sectionId) => {
            const lista = conjuntoActual[sectionId];
            if (!Array.isArray(lista)) return;
            const encontrado = lista.some(
              (item) => item && item.estreno === true
            );
            if (encontrado) {
              tieneEstreno = true;
            }
          });
          if (tieneEstreno) {
            conjuntosConEstreno.push(
              nombreConjunto
            );
          }
        });
        if (conjuntosConEstreno.length > 0) {
          conjuntoElegido = conjuntosConEstreno[Math.floor(
            Math.random() * conjuntosConEstreno.length
          )];
          localStorage.setItem(
            STORAGE_CONJUNTO,
            conjuntoElegido
          );
          localStorage.setItem(
            STORAGE_TIEMPO,
            ahora.toString()
          );
          console.log(
            `\u{1F525} ESTRENO DETECTADO \u2192 prioridad inmediata: ${conjuntoElegido}`
          );
          console.log(
            `\u{1F4CC} Conjuntos con estreno:`,
            conjuntosConEstreno
          );
        } else {
          const conjuntoValido = conjuntoElegido && nombresConjuntos.includes(conjuntoElegido) && ahora - tiempoGuardado < TREINTA_MINUTOS;
          if (!conjuntoValido) {
            conjuntoElegido = nombresConjuntos[Math.floor(
              Math.random() * nombresConjuntos.length
            )];
            localStorage.setItem(
              STORAGE_CONJUNTO,
              conjuntoElegido
            );
            localStorage.setItem(
              STORAGE_TIEMPO,
              ahora.toString()
            );
            console.log(
              `\u{1F3B2} Nuevo conjunto elegido: ${conjuntoElegido}`
            );
          } else {
            console.log(
              `\u267B\uFE0F Manteniendo conjunto: ${conjuntoElegido}`
            );
          }
        }
        if (!conjuntoElegido || !nombresConjuntos.includes(conjuntoElegido)) {
          conjuntoElegido = nombresConjuntos[0];
          localStorage.setItem(
            STORAGE_CONJUNTO,
            conjuntoElegido
          );
          localStorage.setItem(
            STORAGE_TIEMPO,
            ahora.toString()
          );
        }
        const conjunto = datos[conjuntoElegido];
        Object.keys(conjunto).forEach((sectionId) => {
          const wrapper = document.querySelector(
            `#${sectionId} .swiper-wrapper`
          );
          if (!wrapper) return;
          wrapper.innerHTML = "";
          conjunto[sectionId].forEach((item) => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            if (item.poster) {
              slide.style.setProperty(
                "--bg",
                `url("${item.poster}")`
              );
            }
            if (item.backdrop) {
              slide.style.setProperty(
                "--bg-land",
                `url("${item.backdrop}")`
              );
            } else if (item.poster) {
              slide.style.setProperty(
                "--bg-land",
                `url("${item.poster}")`
              );
            }
            slide.innerHTML = `
                    <div class="slide-overlay-top"></div>
                    <div class="overlay"></div>

                    <div class="content">

                        <div class="title">

                            ${item.logo ? `
                                    <img
                                        src="${item.logo}"
                                        alt="${item.titulo}"
                                        class="title-logo ${item.logoClass || ""}"
                                        loading="eager"
                                    >
                                ` : `
                                    <div class="swiper-title-fallback">
                                        ${item.titulo}
                                    </div>
                                `}

                        </div>

                        <div class="meta">

            ${item.estreno ? `<span class="badge-estreno">Estreno</span>` : ""}

            ${item.meta || ""}

        </div>

                        <div class="description">
                            ${item.descripcion || ""}
                        </div>

                        <div class="button-wrapper">

                            <a
                                href="${item.archivo}"
                                class="cta-button swiper-content-link"
                                onclick="event.stopPropagation();"
                            >
                                Ir a ${item.tipo === "movie" ? "la pel\xEDcula" : "la serie"}
                            </a>

                        </div>

                    </div>
                `;
            const logo = slide.querySelector(".title-logo");
            if (logo) {
              const ajustarLogo = () => {
                const ancho = logo.naturalWidth;
                const alto = logo.naturalHeight;
                if (!ancho || !alto) return;
                const proporcion = ancho / alto;
                if (proporcion < 0.75) {
                  logo.classList.add("logo-auto-vertical");
                } else if (proporcion <= 1.25) {
                  logo.classList.add("logo-auto-square");
                } else {
                  logo.classList.add("logo-auto-horizontal");
                }
              };
              if (logo.complete) {
                ajustarLogo();
              } else {
                logo.addEventListener("load", ajustarLogo, {
                  once: true
                });
              }
            }
            slide.addEventListener("click", function(e) {
              if (e.target.closest(".cta-button")) {
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              window.location.assign(item.archivo);
            });
            wrapper.appendChild(slide);
          });
          console.log(
            `\u{1F7E2} ${sectionId}: ${conjunto[sectionId].length} slides`
          );
        });
        return true;
      } catch (error) {
        console.error(
          "\u{1F534} Error cargando swiper-data.json:",
          error
        );
        return false;
      }
    }
    function createSwiper(swiperEl) {
      const swiper = new Swiper(swiperEl, {
        loop: false,
        slidesPerView: 1,
        resistance: false,
        resistanceRatio: 0,
        speed: 700,
        effect: "fade",
        fadeEffect: {
          crossFade: true
        },
        touchRatio: 1,
        touchAngle: 45,
        threshold: 5,
        followFinger: true,
        longSwipes: true,
        longSwipesRatio: 0.15,
        longSwipesMs: 200,
        shortSwipes: true,
        allowTouchMove: true,
        autoplay: {
          delay: 7e3,
          disableOnInteraction: false,
          stopOnLastSlide: true
        },
        navigation: {
          nextEl: swiperEl.querySelector(".swiper-button-next"),
          prevEl: swiperEl.querySelector(".swiper-button-prev")
        },
        pagination: {
          el: swiperEl.querySelector(".swiper-pagination"),
          clickable: true
        },
        observer: true,
        observeParents: true,
        watchSlidesProgress: true,
        on: {
          init(swiper2) {
            updateBackground(swiperEl);
            if (swiperEl.id !== "inicio" && swiper2.slides.length > 1) {
              const randomIndex = Math.floor(Math.random() * swiper2.slides.length);
              swiper2.slideTo(randomIndex, 0, false);
            }
            console.log(
              `\u{1F7E2} Swiper inicializado: ${swiperEl.id}`
            );
          },
          slideChangeTransitionStart(swiper2) {
            updateBackground(swiperEl);
          },
          reachEnd(swiper2) {
            console.log(
              `\u{1F6D1} \xDAltimo slide alcanzado en ${swiperEl.id}`
            );
            if (swiper2.autoplay) {
              swiper2.autoplay.stop();
            }
          }
        }
      });
      return swiper;
    }
    function updateBackground(swiperEl) {
      const activeSlide = swiperEl.querySelector(".swiper-slide-active");
      if (!activeSlide) return;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const bg = isLandscape ? activeSlide.style.getPropertyValue("--bg-land") : activeSlide.style.getPropertyValue("--bg");
      if (!bg) return;
      document.body.style.backgroundImage = bg;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        const swiperActivo = document.querySelector('.mySwiper[style*="display: block"]');
        if (!swiperActivo) return;
        updateBackground(swiperActivo);
      }, 300);
    });
    window.addEventListener("resize", () => {
      clearTimeout(window._dkOrientationTimer);
      window._dkOrientationTimer = setTimeout(() => {
        const swiperActivo = document.querySelector('.mySwiper[style*="display: block"]');
        if (!swiperActivo) return;
        updateBackground(swiperActivo);
      }, 200);
    });
    sections.forEach((swiperEl) => {
      if (swiperEl.id !== "inicio") {
        swiperEl.style.display = "none";
      }
    });
    var lastTabId = null;
    async function activateTab(targetId, options = {}) {
      const { skipScroll = false, skipSlideReset = false, skipOverlay = false } = options;
      if (!skipOverlay) {
        overlay.classList.remove("hidden");
        overlay.classList.add("show");
      }
      setTimeout(async () => {
        tabs.forEach((t) => t.classList.remove("active"));
        const targetTab = document.querySelector(`.tab[data-tab="${targetId}"]`);
        if (targetTab) targetTab.classList.add("active");
        sections.forEach((sec) => {
          sec.style.display = "none";
          const inst = swiperInstances[sec.id];
          if (inst) inst.autoplay.stop();
        });
        const targetSwiperEl = document.getElementById(targetId);
        if (targetSwiperEl) {
          targetSwiperEl.style.display = "block";
          if (!swiperInstances[targetId]) {
            swiperInstances[targetId] = createSwiper(targetSwiperEl);
          }
          const swiper = swiperInstances[targetId];
          if (swiper) {
            swiper.slideTo(0, 0, false);
            swiper.update();
            swiper.updateSize();
            swiper.updateSlides();
            swiper.updateProgress();
            swiper.params.autoplay.delay = 7e3;
            swiper.autoplay.start();
          }
          updateBackground(targetSwiperEl);
        }
        sectionContents.forEach((sectionContent) => {
          sectionContent.style.display = sectionContent.dataset.section === targetId ? "block" : "none";
        });
        if (!skipScroll && targetTab) {
          targetTab.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest"
          });
        }
        if (!skipOverlay) {
          overlay.classList.remove("show");
          setTimeout(() => {
            overlay.classList.add("hidden");
          }, 400);
        }
        lastTabId = targetId;
      }, skipOverlay ? 0 : 200);
    }
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.dataset.tab;
        if (targetId === lastTabId) return;
        activateTab(targetId);
        setMobileMenuState(false);
      });
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        if (lastTabId) {
          const activeSwiper = document.getElementById(lastTabId);
          if (activeSwiper) updateBackground(activeSwiper);
        }
      }, 300);
    });
    window.addEventListener("DOMContentLoaded", () => {
      activateTab("inicio", { skipScroll: true, skipSlideReset: true, skipOverlay: true });
    });
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.substring(1);
      if (hash && hash !== lastTabId) {
        activateTab(hash, { skipSlideReset: true });
      }
    });
    var STORAGE_KEY = "notifications_data";
    function updateNotificationBadge() {
      const badge = document.getElementById("notificationBadge");
      if (!badge) return;
      const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      const count = notifications.length;
      if (count > 0) {
        badge.style.display = "flex";
        badge.textContent = count;
      } else {
        badge.style.display = "none";
      }
    }
    window.addEventListener("DOMContentLoaded", () => {
      updateNotificationBadge();
    });
    var container = document.getElementById("continueWatchingContainer");
    var continueWatchingSection = document.querySelector(".movie-section.continue-watching");
    continueWatchingSection.style.display = "none";
    function normalizeKey(item) {
      if (item.key) return item.key;
      if (item.data?.videoUrl && item.data?.seriesId) {
        return `continue_${item.data.seriesId}_${item.data.videoUrl}`;
      }
      if (item.data?.link) {
        return item.data.link;
      }
      return Math.random().toString();
    }
    function loadContinueWatchingLocal() {
      const items = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        try {
          var raw = localStorage.getItem(key);
          if (!raw) continue;
          var itemData = JSON.parse(raw);
          if (!itemData || typeof itemData !== "object") continue;
          if (key.startsWith("progress_")) {
            const movieId = key.replace("progress_", "");
            const progress = parseFloat(localStorage.getItem(key)) || 0;
            const duration = parseFloat(localStorage.getItem(`duration_${movieId}`)) || 0;
            if (movieId && duration > 0 && progress > 5 && progress < duration * 0.9) {
              const movieData = JSON.parse(
                localStorage.getItem(`movie_${movieId}`) || "{}"
              );
              items.push({
                key,
                data: {
                  ...movieData,
                  movieId,
                  progress,
                  duration
                },
                type: "movie"
              });
              console.log("\u{1F3AC} AGREGANDO PEL\xCDCULA:", {
                movieId,
                progress,
                duration,
                movieData
              });
            }
          }
          console.log("KEY:", key);
          if (key.startsWith("continue_")) {
            console.log("CONTINUE:", itemData);
            const seriesId = itemData.seriesId;
            const videoUrl = itemData.videoUrl;
            if (!seriesId || !videoUrl) continue;
            const progressKey = `progress_${seriesId}_${videoUrl}`;
            const durationKey = `duration_${seriesId}_${videoUrl}`;
            const progress = parseFloat(localStorage.getItem(progressKey)) || 0;
            const duration = parseFloat(localStorage.getItem(durationKey)) || itemData.duration || 1;
            if (progress < duration * 0.9) {
              itemData.progress = progress;
              itemData.duration = duration;
              items.push({ key, data: itemData, type: "series" });
              console.log("AGREGANDO SERIE:", {
                key,
                progress,
                duration,
                itemData
              });
            }
          }
        } catch (e) {
          console.warn("LocalStorage corrupt item skipped:", key);
        }
      }
      return items;
    }
    async function loadContinueWatchingFromSupabase() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase.from("progresos").select("series_id, ultimo_visto, updated_at").eq("id", user.id).order("updated_at", { ascending: false });
        if (error) {
          console.error(error);
          return [];
        }
        return data.filter((item) => item.ultimo_visto).filter((item) => {
          const sid = item.series_id;
          const visto = item.ultimo_visto || {};
          if (visto.completado === true) {
            console.log("\u2705 [FILTER] Contenido completado excluido:", sid);
            return false;
          }
          if (getHiddenList().includes(sid)) {
            console.log("\u{1F648} [FILTER] Oculto localmente, excluido:", sid);
            return false;
          }
          if (sid.startsWith("movie_")) {
            const movieId = sid.replace("movie_", "");
            if (isMovieCompleted(movieId)) {
              console.log("\u{1F3AC} [FILTER] Pel\xEDcula completada excluida:", movieId);
              return false;
            }
          } else {
            if (isSeriesCompleted(sid)) {
              console.log("\u{1F4FA} [FILTER] Serie completada excluida:", sid);
              return false;
            }
          }
          return true;
        }).map((item) => {
          const visto = item.ultimo_visto || {};
          const isMovie = item.series_id.startsWith("movie_");
          if (isMovie) {
            const movieId = item.series_id.replace("movie_", "");
            const progress = parseFloat(localStorage.getItem(`progress_${movieId}`)) || 0;
            const duration = parseFloat(localStorage.getItem(`duration_${movieId}`)) || 0;
            return {
              key: `continue_${item.series_id}`,
              data: {
                ...visto,
                movieId,
                progress,
                duration,
                tipo: "movie",
                visto: true,
                updatedAt: visto.updatedAt || 0
              },
              type: "movie"
            };
          }
          const sid = item.series_id;
          let seriesLocal = {};
          try {
            seriesLocal = JSON.parse(localStorage.getItem(`continue_${sid}`) || "{}");
          } catch (_) {
            seriesLocal = {};
          }
          let sProgress = parseFloat(seriesLocal.progress) || 0;
          let sDuration = parseFloat(seriesLocal.duration) || 0;
          if (!sDuration && visto.videoUrl) {
            sProgress = parseFloat(localStorage.getItem(`progress_${sid}_${visto.videoUrl}`)) || 0;
            sDuration = parseFloat(localStorage.getItem(`duration_${sid}_${visto.videoUrl}`)) || 0;
          }
          return {
            key: `continue_${item.series_id}`,
            data: {
              ...seriesLocal,
              seriesTitle: visto.seriesTitle || seriesLocal.seriesTitle || item.series_id,
              episodeTitle: visto.episodeTitle || seriesLocal.episodeTitle || "",
              poster: visto.poster || seriesLocal.poster || "",
              link: visto.link || seriesLocal.link || "",
              videoUrl: visto.videoUrl || seriesLocal.videoUrl || "",
              seriesId: sid,
              progress: sProgress,
              duration: sDuration,
              tipo: "series",
              visto: true,
              updatedAt: visto.updatedAt || 0
            },
            type: "series"
          };
        });
      } catch (e) {
        console.error("Supabase error:", e);
        return [];
      }
    }
    function renderContinueWatching(items) {
      container.innerHTML = "";
      if (!items || items.length === 0) {
        continueWatchingSection.style.display = "none";
        return;
      }
      const uniqueMap = /* @__PURE__ */ new Map();
      items.forEach((item) => {
        const key = item.key || normalizeKey(item);
        uniqueMap.set(key, item);
      });
      const finalItems = Array.from(uniqueMap.values());
      finalItems.reverse().forEach((item) => {
        const data = item.data;
        if (!data) return;
        const div = document.createElement("div");
        div.classList.add("movie-item");
        const link = document.createElement("a");
        link.href = data.link || "#";
        link.classList.add("continue-card");
        const wrapper = document.createElement("div");
        wrapper.classList.add("image-wrapper");
        const img = document.createElement("img");
        img.src = data.poster || "";
        img.classList.add("poster");
        const menuButton = document.createElement("button");
        menuButton.classList.add("menu-button");
        menuButton.innerHTML = "\u22EE";
        const menu = document.createElement("div");
        menu.classList.add("continue-menu");
        const removeOption = document.createElement("div");
        removeOption.classList.add("menu-option");
        removeOption.textContent = "Quitar de Continuar viendo";
        removeOption.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          localStorage.removeItem(item.key);
          if (item.key && item.key.startsWith("progress_")) {
            const movieId = item.key.replace("progress_", "");
            localStorage.removeItem(`duration_${movieId}`);
            localStorage.removeItem(`hasStarted_${movieId}`);
            localStorage.removeItem(`movie_${movieId}`);
          }
          let supabaseId = null;
          if (item.key && item.key.startsWith("continue_")) {
            supabaseId = item.key.replace("continue_", "");
          } else if (item.key && item.key.startsWith("progress_")) {
            supabaseId = `movie_${item.key.replace("progress_", "")}`;
          }
          if (supabaseId) {
            hideFromContinueWatching(supabaseId);
            console.log("\u{1F648} Ocultado de Continuar Viendo localmente:", supabaseId);
          }
          div.remove();
          if (container.children.length === 0) {
            continueWatchingSection.style.display = "none";
          }
          menu.style.display = "none";
        });
        menu.appendChild(removeOption);
        menuButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll(".continue-menu").forEach((m) => {
            if (m !== menu) {
              m.style.display = "none";
            }
          });
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        });
        const progressContainer = document.createElement("div");
        progressContainer.classList.add("progress-bar-container");
        const bar = document.createElement("div");
        bar.classList.add("progress-bar");
        let percent = 0;
        if (data.duration && data.progress !== void 0) {
          percent = Math.min(data.progress / data.duration * 100, 100);
        }
        bar.style.width = percent + "%";
        progressContainer.appendChild(bar);
        wrapper.appendChild(img);
        wrapper.appendChild(menuButton);
        wrapper.appendChild(menu);
        wrapper.appendChild(progressContainer);
        link.appendChild(wrapper);
        div.appendChild(link);
        const info = document.createElement("div");
        info.classList.add("continue-info");
        const title = document.createElement("div");
        title.classList.add("series-title");
        if (item.type === "series") {
          title.textContent = data.seriesTitle || "Serie";
        } else {
          title.textContent = data.title || data.movieTitle || "Pel\xEDcula";
        }
        const episode = document.createElement("div");
        episode.classList.add("episode-title");
        if (item.type === "series") {
          episode.textContent = data.episodeTitle || "";
        }
        info.appendChild(title);
        if (episode.textContent) {
          info.appendChild(episode);
        }
        div.appendChild(info);
        container.appendChild(div);
      });
      continueWatchingSection.style.display = finalItems.length > 0 ? "block" : "none";
    }
    async function initContinueWatching() {
      const localItems = loadContinueWatchingLocal();
      const supabaseItems = await loadContinueWatchingFromSupabase();
      const localSupabaseIds = new Set(
        localItems.map((i) => {
          if (i.key && i.key.startsWith("progress_")) {
            return `movie_${i.key.replace("progress_", "")}`;
          }
          if (i.key && i.key.startsWith("continue_")) {
            return i.key.replace("continue_", "");
          }
          return null;
        }).filter(Boolean)
      );
      const filteredSupabase = supabaseItems.filter((si) => {
        const sid = si.data?.seriesId || (si.data?.movieId ? `movie_${si.data.movieId}` : null);
        return !sid || !localSupabaseIds.has(sid);
      });
      const merged = [...filteredSupabase, ...localItems];
      renderContinueWatching(merged);
    }
    initContinueWatching();
    function updateProfileImage(src) {
      const avatar = src || localStorage.getItem("profileAvatar") || localStorage.getItem("profileImage") || (typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : null);
      if (!avatar) return;
      const ids = [
        "footerIconImg",
        "footerProfileImage",
        "profileImage",
        "profilePageImage",
        "headerProfileIcon",
        "editableProfile",
        "editableProfileInModal",
        "avatarMain",
        "avatarPreview",
        "avatarCoverPreview",
        "manageAvatar"
      ];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.tagName === "IMG") {
          el.src = avatar;
        }
      });
      document.querySelectorAll(".headerProfileIcon").forEach((img) => {
        img.src = avatar;
      });
      ["defaultProfileIcon", "defaultProfileIconAlt"].forEach((id) => {
        const icon = document.getElementById(id);
        if (icon) icon.style.display = "none";
      });
      localStorage.setItem("profileAvatar", avatar);
      localStorage.setItem("profileImage", avatar);
    }
    window.addEventListener("load", () => {
      updateProfileImage();
    });
    var lastScrollTop = 0;
    var footer = document.querySelector(".footer");
    var footerTicking = false;
    window.addEventListener("scroll", function() {
      if (footerTicking) return;
      footerTicking = true;
      requestAnimationFrame(function() {
        var currentScroll = window.scrollY;
        if (currentScroll > lastScrollTop + 5) {
          footer.classList.add("hidden");
        } else if (currentScroll < lastScrollTop - 5) {
          footer.classList.remove("hidden");
        }
        lastScrollTop = currentScroll;
        footerTicking = false;
      });
    }, { passive: true });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    });
    function mostrarFavoritosEnInicio() {
      const favoritosSection = document.querySelector(".favoritos-section");
      const favoritosContainer = document.getElementById("favoritosContainer");
      if (!favoritosSection || !favoritosContainer) return;
      const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
      favoritosContainer.innerHTML = "";
      if (favoritos.length === 0) {
        favoritosSection.style.display = "none";
        return;
      }
      favoritosSection.style.display = "block";
      favoritos.forEach((favorito) => {
        const item = document.createElement("a");
        item.href = favorito.enlace;
        item.classList.add("movie-item");
        const imagen = document.createElement("img");
        imagen.src = favorito.imagen.match(/src="([^"]+)"/)[1];
        imagen.alt = favorito.nombre;
        imagen.classList.add("poster");
        const titulo = document.createElement("p");
        titulo.classList.add("movie-title");
        const nombreSeguro = favorito.nombre.replace(/\./g, ".\u200B").replace(/@/g, "@\u200B");
        titulo.textContent = nombreSeguro;
        item.appendChild(imagen);
        item.appendChild(titulo);
        favoritosContainer.appendChild(item);
      });
    }
    window.addEventListener("load", mostrarFavoritosEnInicio);
    window.addEventListener("favoritosActualizados", mostrarFavoritosEnInicio);
    window.addEventListener("beforeunload", () => {
      sessionStorage.setItem("scrollTop", window.scrollY);
    });
    window.addEventListener("load", () => {
      const scrollTop = sessionStorage.getItem("scrollTop");
      if (scrollTop) {
        window.scrollTo(0, parseInt(scrollTop));
      }
    });
    var lastScroll = 0;
    var header = document.querySelector("header");
    var tabsContainer = document.querySelector(".tabs");
    var headerTicking = false;
    window.addEventListener("scroll", () => {
      const isDrawerViewport = window.matchMedia("(max-width: 1024px), (orientation: landscape)").matches;
      if (isDrawerViewport) {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll + 5) {
          header?.classList.add("hidden");
        } else if (currentScroll < lastScroll - 5) {
          header?.classList.remove("hidden");
        }
        if (tabsContainer) {
          tabsContainer.classList.remove("open");
          tabsContainer.classList.add("hidden");
        }
        lastScroll = currentScroll;
        return;
      }
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll + 5) {
          header?.classList.add("hidden");
          if (tabsContainer) {
            tabsContainer.classList.add("hidden");
            tabsContainer.classList.remove("open");
          }
        } else if (currentScroll < lastScroll - 5) {
          header?.classList.remove("hidden");
          if (tabsContainer) {
            tabsContainer.classList.remove("hidden");
            tabsContainer.classList.remove("open");
          }
        }
        lastScroll = currentScroll;
        headerTicking = false;
      });
    }, { passive: true });
    if (window.matchMedia("(max-width: 1024px), (orientation: landscape)").matches) {
      if (header) header.classList.remove("hidden");
      if (tabsContainer) {
        tabsContainer.classList.add("hidden");
        tabsContainer.classList.remove("open");
      }
    }
    document.querySelectorAll(".movie-section").forEach((section) => {
      const scrollContainer = section.querySelector(".scroll-container") || section.querySelector(".horizontal-scroll-container");
      const btnLeft = section.querySelector(".scroll-btn.left");
      const btnRight = section.querySelector(".scroll-btn.right");
      if (!scrollContainer || !btnLeft || !btnRight) return;
      btnLeft.addEventListener("click", () => {
        scrollContainer.scrollBy({ left: -300, behavior: "smooth" });
      });
      btnRight.addEventListener("click", () => {
        scrollContainer.scrollBy({ left: 300, behavior: "smooth" });
      });
    });
    document.querySelectorAll(".top-10").forEach((section) => {
      const scrollable = section.querySelector(".scrollable");
      const btnLeft = section.querySelector(".scroll-btn.left");
      const btnRight = section.querySelector(".scroll-btn.right");
      if (!scrollable || !btnLeft || !btnRight) return;
      btnLeft.addEventListener("click", () => {
        scrollable.scrollBy({ left: -300, behavior: "smooth" });
      });
      btnRight.addEventListener("click", () => {
        scrollable.scrollBy({ left: 300, behavior: "smooth" });
      });
    });
    document.querySelectorAll(".scroll-wrapper").forEach((wrapper) => {
      const container2 = wrapper.querySelector(".scrollable") || wrapper.querySelector(".scroll-container");
      const btnLeft = wrapper.querySelector(".scroll-btn.left");
      const btnRight = wrapper.querySelector(".scroll-btn.right");
      if (!container2 || !btnLeft || !btnRight) return;
      btnLeft.addEventListener("click", () => {
        container2.scrollBy({ left: -300, behavior: "smooth" });
      });
      btnRight.addEventListener("click", () => {
        container2.scrollBy({ left: 300, behavior: "smooth" });
      });
    });
    function showNotificationOnce(id, version = "v4", delay = 1e3) {
      setTimeout(() => {
        const key = `dismissed_${id}_${version}`;
        const dismissed = localStorage.getItem(key);
        if (!dismissed) {
          const noti = document.getElementById(id);
          const overlay2 = document.getElementById("notificationOverlay");
          if (noti && overlay2) {
            noti.style.display = "block";
            overlay2.style.display = "block";
            noti.querySelectorAll("[data-close]").forEach((btn) => {
              btn.onclick = () => {
                localStorage.setItem(key, "true");
                closeFloatingNotification();
              };
            });
          }
        }
      }, delay);
    }
    function closeFloatingNotification() {
      document.getElementById("notificationOverlay").style.display = "none";
      document.querySelectorAll(".floating-notification").forEach((n) => {
        n.style.display = "none";
      });
    }
    showNotificationOnce("notificationTelegram", "v5", 1500);
    showNotificationOnce("notificationEpisodio", "v10", 2e3);
    showNotificationOnce("notificationPelicula", "v27", 2500);
    showNotificationOnce("notificationUpdate", "v18", 3e3);
    if (sessionStorage.getItem("intro_shown")) {
      setTimeout(() => {
        const intro = document.getElementById("opening");
        if (!intro) return;
        intro.classList.add("hide");
        setTimeout(() => intro.remove(), 1200);
      }, 7e3);
    }
    var observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.decoding = "async";
          img.src = img.dataset.src;
          img.onload = () => {
            img.classList.add("loaded");
          };
          observer.unobserve(img);
        }
      });
    }, {
      // Carga las imágenes ANTES de entrar en pantalla para que no aparezcan
      // de golpe al deslizar (pop-in)
      rootMargin: "600px 0px"
    });
    document.querySelectorAll(".lazy-img").forEach((img) => {
      observer.observe(img);
    });
    window.addEventListener("load", () => {
      const hash = window.location.hash.replace("#", "");
      activateTab(hash || "inicio", {
        skipScroll: true,
        skipOverlay: true
      });
    });
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      activateTab(hash || "inicio", {
        skipScroll: true,
        skipOverlay: true
      });
    });
    async function loadFloatingNotification() {
      const { data, error } = await supabase.from("floating_notifications").select("*").eq("enabled", true).order("created_at", { ascending: false }).limit(1).single();
      if (error) {
        console.log("No hay notificaci\xF3n flotante:", error);
        return;
      }
      if (!data) return;
      const movies = await fetch("movies.json").then((r) => r.json());
      const movie = movies.find(
        (m) => ("/" + m.link).replace("//", "/") === data.action
      );
      console.log("\u{1F3AC} Contenido encontrado:", movie);
      console.log("TIPO SUPABASE:", data.type);
      let header2 = data.title;
      let description = data.message;
      let year = "";
      let originalDescription = data.message;
      if (movie) {
        year = (movie.details.match(/\d{4}/) || [""])[0];
        switch (data.type) {
          case "new_movie":
            header2 = `
        \xA1Nueva pel\xEDcula disponible!<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "new_series":
            header2 = `
        \xA1Nueva serie disponible!<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "movie":
            header2 = `
        Recomendaci\xF3n para ti<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "series":
            header2 = `
        No te pierdas esta serie<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "season":
            header2 = `
        Nueva temporada disponible<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "collection":
            header2 = `
        Nueva colecci\xF3n<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          case "update":
            header2 = `
        Nueva actualizaci\xF3n<br>
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
            break;
          default:
            header2 = `
        <strong>\u201C${movie.title}\u201D</strong><br>
        (${year})
        `;
        }
        try {
          const response = await fetch(movie.link);
          const html = await response.text();
          const doc = new DOMParser().parseFromString(
            html,
            "text/html"
          );
          originalDescription = doc.querySelector(".description")?.textContent.trim() || data.message;
          if (originalDescription.length > 100) {
            originalDescription = originalDescription.substring(0, 100).trim() + "...";
          }
          let enjoyText = "";
          if (data.type === "series") {
            enjoyText = "Disfruta todos los episodios en Digital Knight.";
          } else {
            enjoyText = "Disfruta esta pel\xEDcula en Digital Knight.";
          }
          description = `
${originalDescription}
<br><br>
${enjoyText}
`;
          const escapedTitle = movie.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          description = description.replace(
            new RegExp(escapedTitle, "gi"),
            `<strong>${movie.title}</strong>`
          );
          console.log("\u{1F4DD} Descripci\xF3n:", description);
        } catch (err) {
          console.error(
            "Error cargando descripci\xF3n:",
            err
          );
        }
      }
      const notificationKey = `floating_seen_${data.id}_${data.version}`;
      if (data.show_once && localStorage.getItem(notificationKey)) {
        console.log(
          "\u23E9 Flotante ya vista:",
          notificationKey
        );
        return;
      }
      const box = document.getElementById(
        "dynamicFloatingNotification"
      );
      if (!box) return;
      document.getElementById(
        "dynamicNotificationImage"
      ).src = data.image;
      console.log("HEADER FINAL:", header2);
      console.log("DESCRIPTION FINAL:", description);
      document.getElementById(
        "dynamicNotificationTitle"
      ).innerHTML = header2;
      document.getElementById(
        "dynamicNotificationMessage"
      ).innerHTML = description;
      const button = document.getElementById(
        "dynamicNotificationButton"
      );
      button.href = data.action.replace(/^\//, "");
      button.textContent = data.button_text || "VER AHORA";
      box.style.display = "block";
      const overlay2 = document.getElementById(
        "notificationOverlay"
      );
      if (overlay2) {
        overlay2.style.display = "block";
      }
      box.querySelectorAll("[data-close]").forEach((btn) => {
        btn.onclick = () => {
          if (data.show_once) {
            localStorage.setItem(
              notificationKey,
              "true"
            );
            console.log(
              "\u2705 Flotante guardada como vista:",
              notificationKey
            );
          }
          box.style.display = "none";
          if (overlay2) {
            overlay2.style.display = "none";
          }
        };
      });
    }
    loadFloatingNotification();
    document.addEventListener("DOMContentLoaded", async () => {
      console.log("\u{1F680} script.js cargado");
      const cargado = await cargarSwiperInicio();
      if (cargado) {
        console.log("\u2705 swiper-data.json conectado correctamente");
        const inicio = document.getElementById("inicio");
        if (inicio && !swiperInstances.inicio) {
          swiperInstances.inicio = createSwiper(inicio);
          swiperInstances.inicio.update();
          swiperInstances.inicio.updateSize();
          swiperInstances.inicio.updateSlides();
          updateBackground(inicio);
          swiperInstances.inicio.autoplay.start();
        }
      } else {
        console.error(
          "\u274C No se pudo cargar el contenido de Inicio"
        );
      }
    });
  }
});
export default require_script();
