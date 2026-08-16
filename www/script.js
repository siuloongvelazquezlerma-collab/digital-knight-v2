import { supabase } from './js/supabaseClient.js';
// ⬅️ Quitar lazy inmediatamente si ya todas se cargaron antes
if (localStorage.getItem("mainImagesLoaded") === "true") {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img[loading='lazy']").forEach(img => {
      img.removeAttribute("loading");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll("img[loading='lazy']");
  let loadedCount = 0;

  images.forEach(img => {
    img.addEventListener("load", () => {
      loadedCount++;
      if (loadedCount === images.length) {
        // ✅ Todas las imágenes ya cargaron al menos una vez
        localStorage.setItem("mainImagesLoaded", "true");
      }
      // quitar lazy una vez cargada
      img.removeAttribute("loading");
    }, { once: true });
  });
});

  document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

document.addEventListener('copy', function(event) {
    event.preventDefault();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "F12" || 
        (event.ctrlKey && event.shiftKey && event.key === "I") || 
        (event.ctrlKey && event.key === "U") || 
        (event.ctrlKey && event.key === "C")) {
        event.preventDefault();
    }
});

document.addEventListener("dragstart", function(event) {
    event.preventDefault();
});
  
const swiperInstances = {};
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.mySwiper');
const overlay = document.getElementById('transitionOverlay');
const sectionContents = document.querySelectorAll('.section-content'); 
async function cargarSwiperInicio() {

    console.log("🔵 Cargando swiper-data.json...");

    try {

        const respuesta = await fetch('swiper-data.json');

        if (!respuesta.ok) {
            throw new Error('No se pudo cargar swiper-data.json');
        }

        const datos = await respuesta.json();

        console.log("🟢 JSON cargado:", datos);

        // ==========================================
// 🎲 ELEGIR UN CONJUNTO CADA 30 MINUTOS
// ==========================================

const nombresConjuntos = Object.keys(datos);

const STORAGE_CONJUNTO = 'dk_swiper_conjunto';
const STORAGE_TIEMPO = 'dk_swiper_conjunto_time';

const ahora = Date.now();

let conjuntoElegido =
    localStorage.getItem(STORAGE_CONJUNTO);

const tiempoGuardado =
    parseInt(localStorage.getItem(STORAGE_TIEMPO) || '0', 10);

const TREINTA_MINUTOS = 30 * 60 * 1000;


// ==========================================
// COMPROBAR SI EL CONJUNTO SIGUE VIGENTE
// ==========================================

const conjuntoValido =
    conjuntoElegido &&
    nombresConjuntos.includes(conjuntoElegido) &&
    (ahora - tiempoGuardado) < TREINTA_MINUTOS;


// ==========================================
// SI YA PASARON 30 MINUTOS
// ELEGIR UNO NUEVO
// ==========================================

if (!conjuntoValido) {

    conjuntoElegido =
        nombresConjuntos[
            Math.floor(Math.random() * nombresConjuntos.length)
        ];

    localStorage.setItem(
        STORAGE_CONJUNTO,
        conjuntoElegido
    );

    localStorage.setItem(
        STORAGE_TIEMPO,
        ahora.toString()
    );

    console.log(
        `🎲 Nuevo conjunto elegido: ${conjuntoElegido}`
    );

} else {

    console.log(
        `♻️ Manteniendo conjunto: ${conjuntoElegido}`
    );

}


// ==========================================
// OBTENER CONJUNTO
// ==========================================

const conjunto = datos[conjuntoElegido];

        // ==========================================
        // CARGAR LAS SECCIONES DEL CONJUNTO ELEGIDO
        // ==========================================

        Object.keys(conjunto).forEach(sectionId => {

            const wrapper = document.querySelector(
                `#${sectionId} .swiper-wrapper`
            );

            if (!wrapper) return;

            wrapper.innerHTML = '';

            conjunto[sectionId].forEach(item => {

                const slide = document.createElement('div');

slide.className = 'swiper-slide';

/* ==========================================
   FONDOS DEL SWIPER
   poster  → vertical
   backdrop → horizontal
   ========================================== */

if (item.poster) {

    slide.style.setProperty(
        '--bg',
        `url("${item.poster}")`
    );

}

if (item.backdrop) {

    slide.style.setProperty(
        '--bg-land',
        `url("${item.backdrop}")`
    );

} else if (item.poster) {

    slide.style.setProperty(
        '--bg-land',
        `url("${item.poster}")`
    );

}

slide.innerHTML = `
                    <div class="slide-overlay-top"></div>
                    <div class="overlay"></div>

                    <div class="content">

                        <div class="title">

                            ${
                                item.logo
                                ? `
                                    <img
                                        src="${item.logo}"
                                        alt="${item.titulo}"
                                        class="title-logo ${item.logoClass || ''}"
                                        loading="eager"
                                    >
                                `
                                : `
                                    <div class="swiper-title-fallback">
                                        ${item.titulo}
                                    </div>
                                `
                            }

                        </div>

                        <div class="meta">
                            ${item.meta || ''}
                        </div>

                        <div class="description">
                            ${item.descripcion || ''}
                        </div>

                        <div class="button-wrapper">

                            <a
                                href="${item.archivo}"
                                class="cta-button swiper-content-link"
                                onclick="event.stopPropagation();"
                            >
                                Ir a ${
                                    item.tipo === 'movie'
                                    ? 'la película'
                                    : 'la serie'
                                }
                            </a>

                        </div>

                    </div>
                `;

               // =========================================================
// DETECTAR AUTOMÁTICAMENTE LA PROPORCIÓN DEL LOGO
// =========================================================

const logo = slide.querySelector('.title-logo');

if (logo) {

    const ajustarLogo = () => {

        const ancho = logo.naturalWidth;
        const alto = logo.naturalHeight;

        if (!ancho || !alto) return;

        const proporcion = ancho / alto;

        // Logo vertical
        if (proporcion < 0.75) {

            logo.classList.add('logo-auto-vertical');

        }

        // Logo cuadrado / redondo
        else if (proporcion <= 1.25) {

            logo.classList.add('logo-auto-square');

        }

        // Logo horizontal
        else {

            logo.classList.add('logo-auto-horizontal');

        }
    };

    if (logo.complete) {
        ajustarLogo();
    } else {
        logo.addEventListener('load', ajustarLogo, {
            once: true
        });
    }
}

                slide.addEventListener('click', function(e) {

                    if (e.target.closest('.cta-button')) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    window.location.assign(item.archivo);

                });

                wrapper.appendChild(slide);

            });

            console.log(
                `🟢 ${sectionId}: ${conjunto[sectionId].length} slides`
            );

        });

        return true;

    } catch (error) {

        console.error(
            '🔴 Error cargando swiper-data.json:',
            error
        );

        return false;
    }
}

// ==========================================
// INICIALIZAR SWIPER DE INICIO
// ==========================================

// ==========================================
// CREAR SWIPER
// ==========================================

function createSwiper(swiperEl) {

   const swiper = new Swiper(swiperEl, {
    loop: false,

    slidesPerView: 1,

    resistance: true,
    resistanceRatio: 0.25,

    speed: 500,

    effect: 'slide',

    touchRatio: 1,
    touchAngle: 45,
    threshold: 3,

    followFinger: true,

    longSwipes: true,
    longSwipesRatio: 0.12,
    longSwipesMs: 150,

    shortSwipes: true,

    allowTouchMove: true,

    autoplay: {
        delay: 7000,
        disableOnInteraction: false,
        stopOnLastSlide: true
    },

    navigation: {
        nextEl: swiperEl.querySelector('.swiper-button-next'),
        prevEl: swiperEl.querySelector('.swiper-button-prev')
    },

    pagination: {
        el: swiperEl.querySelector('.swiper-pagination'),
        clickable: true
    },

    observer: true,
    observeParents: true,
    watchSlidesProgress: true,

    on: {

        init(swiper) {

            updateBackground(swiperEl);

            if (swiperEl.id !== 'inicio' && swiper.slides.length > 1) {

                const randomIndex =
                    Math.floor(Math.random() * swiper.slides.length);

                swiper.slideTo(randomIndex, 0, false);
            }

            console.log(
                `🟢 Swiper inicializado: ${swiperEl.id}`
            );
        },

        slideChangeTransitionStart(swiper) {

            updateBackground(swiperEl);

        },

        reachEnd(swiper) {

            console.log(
                `🛑 Último slide alcanzado en ${swiperEl.id}`
            );

            if (swiper.autoplay) {
                swiper.autoplay.stop();
            }

        }

    }
});

    return swiper;
}


function updateBackground(swiperEl) {

    const activeSlide =
        swiperEl.querySelector('.swiper-slide-active');

    if (!activeSlide) return;

    const isLandscape =
        window.matchMedia("(orientation: landscape)").matches;

    const bg = isLandscape
        ? activeSlide.style.getPropertyValue('--bg-land')
        : activeSlide.style.getPropertyValue('--bg');

    if (!bg) return;

    document.body.style.backgroundImage = bg;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

// ==========================================
// CAMBIO DE ORIENTACIÓN
// ==========================================

window.addEventListener('orientationchange', () => {

    setTimeout(() => {

        const swiperActivo =
            document.querySelector('.mySwiper[style*="display: block"]');

        if (!swiperActivo) return;

        updateBackground(swiperActivo);

    }, 300);

});

window.addEventListener('resize', () => {

    clearTimeout(window._dkOrientationTimer);

    window._dkOrientationTimer = setTimeout(() => {

        const swiperActivo =
            document.querySelector('.mySwiper[style*="display: block"]');

        if (!swiperActivo) return;

        updateBackground(swiperActivo);

    }, 200);

});


// Oculta los demás de entrada
sections.forEach(swiperEl => {
  if (swiperEl.id !== 'inicio') {
    swiperEl.style.display = 'none';
  }
});

let lastTabId = null;

// --- Función central para activar tab con overlay fade ---
async function activateTab(targetId, options = {}) {
  const { skipScroll = false, skipSlideReset = false, skipOverlay = false } = options;

  if (!skipOverlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('show');
  }

  setTimeout(async () => {
    // Activar visualmente la tab
    tabs.forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.tab[data-tab="${targetId}"]`);
    if (targetTab) targetTab.classList.add('active');

    // Ocultar todos los Swipers
    sections.forEach(sec => {
      sec.style.display = 'none';
      const inst = swiperInstances[sec.id];
      if (inst) inst.autoplay.stop();
    });

    // Mostrar Swiper correspondiente
    // Mostrar Swiper correspondiente
const targetSwiperEl = document.getElementById(targetId);

if (targetSwiperEl) {

    targetSwiperEl.style.display = 'block';

    // Crear Swiper solo al primer uso
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

        swiper.params.autoplay.delay = 7000;

        swiper.autoplay.start();
    }

    updateBackground(targetSwiperEl);
}


// ==========================================
// Mostrar sección de contenido
// ==========================================

sectionContents.forEach(sectionContent => {

    sectionContent.style.display =
        sectionContent.dataset.section === targetId
            ? 'block'
            : 'none';

});


// ==========================================
// Scroll de la tab
// ==========================================

if (!skipScroll && targetTab) {

    targetTab.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
    });

}


// ==========================================
// Ocultar overlay
// ==========================================

if (!skipOverlay) {

    overlay.classList.remove('show');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 400);

}


lastTabId = targetId;

}, skipOverlay ? 0 : 200);

}

// Click en tabs
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.dataset.tab;
    if (targetId === lastTabId) return; 
    activateTab(targetId);
  });
});

// Manejo de orientación
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (lastTabId) {
      const activeSwiper = document.getElementById(lastTabId);
      if (activeSwiper) updateBackground(activeSwiper);
    }
  }, 300);
});

// Al cargar la página -> siempre ir a "inicio" pero sin overlay
window.addEventListener('DOMContentLoaded', () => {
  activateTab('inicio', { skipScroll: true, skipSlideReset: true, skipOverlay: true });
});

// Manejar botón Atrás/Adelante
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  if (hash && hash !== lastTabId) {
    activateTab(hash, { skipSlideReset: true });
  }
});

const STORAGE_KEY = "notifications_data";

function updateNotificationBadge() {

  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  const notifications =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

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

var container = document.getElementById('continueWatchingContainer');
var continueWatchingSection = document.querySelector('.movie-section.continue-watching');

continueWatchingSection.style.display = 'none';

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

// -----------------------------
// LOCAL STORAGE
// -----------------------------
function loadContinueWatchingLocal() {

  const items = [];

  for (var i = 0; i < localStorage.length; i++) {

    var key = localStorage.key(i);

    try {
      var raw = localStorage.getItem(key);
      if (!raw) continue;

      var itemData = JSON.parse(raw);
      if (!itemData || typeof itemData !== 'object') continue;

      // 🎬 Películas
      if (key.startsWith('movie_')) {

        if (
          typeof itemData.progress === 'number' &&
          typeof itemData.duration === 'number' &&
          itemData.progress < itemData.duration * 0.9
        ) {
          items.push({ key, data: itemData, type: 'movie' });
        }
      }

      console.log("KEY:", key);
      // 📺 Series
      if (key.startsWith('continue_')) {
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

          items.push({ key, data: itemData, type: 'series' });
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



// -----------------------------
// SUPABASE
// -----------------------------
async function loadContinueWatchingFromSupabase() {

  try {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('progresos')
      .select('*')
      .eq('id', user.id)
      .order('visto_en', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data.map(item => ({
      key: `continue_${item.series_id}_${item.video_url}`,
      data: {
        seriesTitle: item.series_id,
        episodeTitle: item.episodio,
        poster: item.poster || '',
        link: item.link || '',
        progress: item.progreso || 0,
        duration: item.duration || 1,
        videoUrl: item.video_url || ''
      },
      type: 'series'
    }));

  } catch (e) {
    console.error("Supabase error:", e);
    return [];
  }
}

// -----------------------------
// RENDER (UN SOLO CONTROL)
// -----------------------------
function renderContinueWatching(items) {

  container.innerHTML = '';

  if (!items || items.length === 0) {
    continueWatchingSection.style.display = 'none';
    return;
  }

  const uniqueMap = new Map();

  items.forEach(item => {
    const key = item.key || normalizeKey(item);
    uniqueMap.set(key, item);
  });

  const finalItems = Array.from(uniqueMap.values());

  finalItems
    .reverse()
    .forEach(item => {

      const data = item.data;
      if (!data) return;

      const div = document.createElement('div');
      div.classList.add('movie-item');

      const link = document.createElement('a');
      link.href = data.link || '#';
      link.classList.add('continue-card');

      const wrapper = document.createElement('div');
      wrapper.classList.add('image-wrapper');

      const img = document.createElement('img');
      img.src = data.poster || '';
      img.classList.add('poster');

      const menuButton = document.createElement('button');
menuButton.classList.add('menu-button');
menuButton.innerHTML = '⋮';


const menu = document.createElement('div');
menu.classList.add('continue-menu');


const removeOption = document.createElement('div');
removeOption.classList.add('menu-option');
removeOption.textContent = 'Quitar de Continuar viendo';


removeOption.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  localStorage.removeItem(item.key);

  div.remove();

  if (container.children.length === 0) {
    continueWatchingSection.style.display = 'none';
  }

  menu.style.display = 'none';
});


menu.appendChild(removeOption);


menuButton.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  document.querySelectorAll('.continue-menu').forEach(m => {
    if (m !== menu) {
      m.style.display = 'none';
    }
  });

  menu.style.display =
    menu.style.display === 'block'
      ? 'none'
      : 'block';
});

      const progressContainer = document.createElement('div');
      progressContainer.classList.add('progress-bar-container');

      const bar = document.createElement('div');
      bar.classList.add('progress-bar');

      let percent = 0;

      if (data.duration && data.progress !== undefined) {
        percent = Math.min((data.progress / data.duration) * 100, 100);
      }

      bar.style.width = percent + '%';

      progressContainer.appendChild(bar);
      wrapper.appendChild(img);
      wrapper.appendChild(menuButton);
wrapper.appendChild(menu);
      wrapper.appendChild(progressContainer);
      link.appendChild(wrapper);
      div.appendChild(link);

      // Información debajo de la portada
const info = document.createElement('div');
info.classList.add('continue-info');

const title = document.createElement('div');
title.classList.add('series-title');

if (item.type === 'series') {
  title.textContent = data.seriesTitle || 'Serie';
} else {
  title.textContent = data.title || data.movieTitle || 'Película';
}

const episode = document.createElement('div');
episode.classList.add('episode-title');

if (item.type === 'series') {
  episode.textContent = data.episodeTitle || '';
}

info.appendChild(title);

if (episode.textContent) {
  info.appendChild(episode);
}

div.appendChild(info);

      container.appendChild(div);
    });

  continueWatchingSection.style.display = finalItems.length > 0 ? 'block' : 'none';
}
// -----------------------------
// INIT (FLUJO SEGURO)
// -----------------------------
async function initContinueWatching() {

  const localItems = loadContinueWatchingLocal();
  const supabaseItems = await loadContinueWatchingFromSupabase();

  const merged = [...localItems, ...supabaseItems];

  renderContinueWatching(merged);
}

initContinueWatching();



  // ================================
// 👤 PERFIL – sincronizar imágenes (UNIFICADO)
// ================================
function updateProfileImage(src) {
  // Permite llamar sin parámetro (restaura desde localStorage)
  const avatar =
    src ||
    localStorage.getItem('profileAvatar') ||
    localStorage.getItem('profileImage') ||
    (typeof DEFAULT_AVATAR !== 'undefined' ? DEFAULT_AVATAR : null);

  if (!avatar) return;

  const ids = [
    'footerIconImg',
    'footerProfileImage',
    'profileImage',
    'profilePageImage',
    'headerProfileIcon',
    'editableProfile',
    'editableProfileInModal',
    'avatarMain',
    'avatarPreview',
    'avatarCoverPreview',
    'manageAvatar'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tagName === 'IMG') {
      el.src = avatar;
    }
  });

  // Actualizar todos los iconos del header
document.querySelectorAll(".headerProfileIcon").forEach(img => {
  img.src = avatar;
});

  // Ocultar iconos por defecto si existen
  ['defaultProfileIcon', 'defaultProfileIconAlt'].forEach(id => {
    const icon = document.getElementById(id);
    if (icon) icon.style.display = 'none';
  });

  // Guardar en ambos para compatibilidad entre páginas
  localStorage.setItem('profileAvatar', avatar);
  localStorage.setItem('profileImage', avatar);
}

// ================================
// 🔄 Restaurar avatar al cargar página
// ================================
window.addEventListener('load', () => {
  updateProfileImage();
});

  
  // Ocultar footer al hacer scroll hacia abajo
  var lastScrollTop = 0;
  var footer = document.querySelector(".footer");

  
  
  window.addEventListener("scroll", function () {
      var currentScroll = window.scrollY;
  
      if (currentScroll > lastScrollTop) {
          footer.classList.add("hidden");
      } else {
          footer.classList.remove("hidden");
      }
  
      lastScrollTop = currentScroll;
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100); // tiempo suficiente para aplicar el cambio de orientación
  });
  
  function mostrarFavoritosEnInicio() {
    const favoritosSection = document.querySelector(".favoritos-section");
    const favoritosContainer = document.getElementById("favoritosContainer");
    if (!favoritosSection || !favoritosContainer) return;
  
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritosContainer.innerHTML = "";
  
    if (favoritos.length === 0) {
      favoritosSection.style.display = "none"; // Oculta la sección si no hay favoritos
      return;
    }
  
    favoritosSection.style.display = "block"; // Muestra la sección
  
    favoritos.forEach((favorito) => {
      const item = document.createElement("a");
      item.href = favorito.enlace;
      item.classList.add("movie-item");
  
      const imagen = document.createElement("img");
      imagen.src = favorito.imagen.match(/src="([^"]+)"/)[1]; // Extrae la URL de la imagen
      imagen.alt = favorito.nombre;
      imagen.classList.add("poster");
  
      const titulo = document.createElement("p");
      titulo.classList.add("movie-title");
  
      // Rompe enlaces invisibles si contienen punto o arroba
      const nombreSeguro = favorito.nombre.replace(/\./g, ".\u200B").replace(/@/g, "@\u200B");
      titulo.textContent = nombreSeguro;
  
      item.appendChild(imagen);
      item.appendChild(titulo);
      favoritosContainer.appendChild(item);
    });
  }
  
  // Ejecutar al cargar la página
  window.addEventListener("load", mostrarFavoritosEnInicio);
  
  // Volver a mostrar si se actualizan los favoritos
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

let lastScroll = 0;
const header = document.querySelector('header');
const tabsContainer = document.querySelector('.tabs');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > lastScroll) {
    // Scroll hacia abajo
    header.classList.add('hidden');
    tabsContainer.classList.add('hidden');
  } else {
    // Scroll hacia arriba
    header.classList.remove('hidden');
    tabsContainer.classList.remove('hidden');
  }

  lastScroll = currentScroll;
});


// ==== Movie sections con flechas ====
document.querySelectorAll('.movie-section').forEach(section => {
  const scrollContainer = section.querySelector('.scroll-container') || section.querySelector('.horizontal-scroll-container');
  const btnLeft = section.querySelector('.scroll-btn.left');
  const btnRight = section.querySelector('.scroll-btn.right');

  if (!scrollContainer || !btnLeft || !btnRight) return;

  btnLeft.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
  });
});

// ==== Top 10 sections con scroll ====
document.querySelectorAll('.top-10').forEach(section => {
  const scrollable = section.querySelector('.scrollable');
  const btnLeft = section.querySelector('.scroll-btn.left');
  const btnRight = section.querySelector('.scroll-btn.right');

  if (!scrollable || !btnLeft || !btnRight) return;

  btnLeft.addEventListener('click', () => {
    scrollable.scrollBy({ left: -300, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    scrollable.scrollBy({ left: 300, behavior: 'smooth' });
  });
});

// ==== Wrappers genéricos con fallback ====
document.querySelectorAll('.scroll-wrapper').forEach(wrapper => {
  const container = wrapper.querySelector('.scrollable') || wrapper.querySelector('.scroll-container');
  const btnLeft = wrapper.querySelector('.scroll-btn.left');
  const btnRight = wrapper.querySelector('.scroll-btn.right');

  if (!container || !btnLeft || !btnRight) return;

  btnLeft.addEventListener('click', () => {
    container.scrollBy({ left: -300, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    container.scrollBy({ left: 300, behavior: 'smooth' });
  });
});



 /* ===============================
   SISTEMA UNIVERSAL DE NOTIFICACIONES
   -> Mostrar notificación por ID y versión
================================= */

function showNotificationOnce(id, version = "v4", delay = 1000) {
  setTimeout(() => {
    const key = `dismissed_${id}_${version}`;
    const dismissed = localStorage.getItem(key);

    if (!dismissed) {
      const noti = document.getElementById(id);
      const overlay = document.getElementById("notificationOverlay");

      if (noti && overlay) {
        noti.style.display = "block";
        overlay.style.display = "block";

        noti.querySelectorAll("[data-close]").forEach(btn => {
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
  document.querySelectorAll(".floating-notification").forEach(n => {
    n.style.display = "none";
  });
}

// ⭐⭐ LLAMADA AQUÍ MISMO ⭐⭐
showNotificationOnce("notificationTelegram", "v5", 1500);

showNotificationOnce("notificationEpisodio", "v10", 2000);

showNotificationOnce("notificationPelicula", "v27", 2500);

showNotificationOnce("notificationUpdate", "v18", 3000);

if (sessionStorage.getItem("intro_shown")) {
  setTimeout(() => {
    const intro = document.getElementById("opening");
    if (!intro) return;
    intro.classList.add("hide");
    setTimeout(() => intro.remove(), 1200);
  }, 7000);
}


const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;

      img.src = img.dataset.src;

      img.onload = () => {
        img.classList.add("loaded");
      };

      observer.unobserve(img);
    }
  });
}, {
  rootMargin: "100px"
});

document.querySelectorAll(".lazy-img").forEach(img => {
  observer.observe(img);
});


window.addEventListener("load", () => {

  const hash = window.location.hash.replace("#", "");

  activateTab(hash || "inicio", {
    skipScroll: true,
    skipOverlay: true
  });

});

// Detectar atrás/adelante del navegador
window.addEventListener("hashchange", () => {

  const hash = window.location.hash.replace("#", "");

  activateTab(hash || "inicio", {
    skipScroll: true,
    skipOverlay: true
  });

});


/* ===============================
   NOTIFICACIONES FLOTANTES DINÁMICAS
   DESDE SUPABASE
================================= */

async function loadFloatingNotification() {

  const { data, error } = await supabase
    .from("floating_notifications")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log("No hay notificación flotante:", error);
    return;
  }

  if (!data) return;

  // ===============================
  // Buscar el contenido en movies.json
  // ===============================

  const movies = await fetch("movies.json")
    .then(r => r.json());

  const movie = movies.find(m =>
    ("/" + m.link).replace("//", "/") === data.action
  );

  console.log("🎬 Contenido encontrado:", movie);

  console.log("TIPO SUPABASE:", data.type);

  let header = data.title;
let description = data.message;
let year = "";
let originalDescription = data.message;

  if (movie) {

  year =
    (movie.details.match(/\d{4}/) || [""])[0];


  switch (data.type) {

    case "new_movie":
        header = `
        ¡Nueva película disponible!<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "new_series":
        header = `
        ¡Nueva serie disponible!<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "movie":
        header = `
        Recomendación para ti<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "series":
        header = `
        No te pierdas esta serie<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "season":
        header = `
        Nueva temporada disponible<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "collection":
        header = `
        Nueva colección<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    case "update":
        header = `
        Nueva actualización<br>
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
        break;

    default:
        header = `
        <strong>“${movie.title}”</strong><br>
        (${year})
        `;
}



    // ===============================
    // Obtener descripción desde la página
    // ===============================

    try {

      const response = await fetch(movie.link);

      const html = await response.text();

      const doc = new DOMParser().parseFromString(
        html,
        "text/html"
      );

   originalDescription =
  doc.querySelector(".description")
    ?.textContent
    .trim() || data.message;


if (originalDescription.length > 100) {
  originalDescription =
    originalDescription.substring(0,100).trim() + "...";
}




// Solo descripción de la historia
let enjoyText = "";

if (data.type === "series") {
  enjoyText = "Disfruta todos los episodios en Digital Knight.";
} else {
  enjoyText = "Disfruta esta película en Digital Knight.";
}


description = `
${originalDescription}
<br><br>
${enjoyText}
`;
      

      // Resaltar automáticamente el título
const escapedTitle = movie.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

description = description.replace(
  new RegExp(escapedTitle, "gi"),
  `<strong>${movie.title}</strong>`
);

      console.log("📝 Descripción:", description);

    } catch (err) {

      console.error(
        "Error cargando descripción:",
        err
      );

    }

  }

  // ===============================
  // CONTROL MOSTRAR UNA SOLA VEZ
  // ===============================

  const notificationKey =
    `floating_seen_${data.id}_${data.version}`;

  if (
    data.show_once &&
    localStorage.getItem(notificationKey)
  ) {
    console.log(
      "⏩ Flotante ya vista:",
      notificationKey
    );
    return;
  }

  const box =
    document.getElementById(
      "dynamicFloatingNotification"
    );

  if (!box) return;

  document.getElementById(
    "dynamicNotificationImage"
  ).src = data.image;

console.log("HEADER FINAL:", header);
console.log("DESCRIPTION FINAL:", description);

  document.getElementById(
  "dynamicNotificationTitle"
).innerHTML = header;


document.getElementById(
  "dynamicNotificationMessage"
).innerHTML = description;

  const button =
    document.getElementById(
      "dynamicNotificationButton"
    );

  button.href =
    data.action.replace(/^\//, "");

  button.textContent =
    data.button_text || "VER AHORA";

  box.style.display = "block";

  const overlay =
    document.getElementById(
      "notificationOverlay"
    );

  if (overlay) {
    overlay.style.display = "block";
  }

  box.querySelectorAll("[data-close]")
    .forEach(btn => {

      btn.onclick = () => {

        if (data.show_once) {

          localStorage.setItem(
            notificationKey,
            "true"
          );

          console.log(
            "✅ Flotante guardada como vista:",
            notificationKey
          );

        }

        box.style.display = "none";

        if (overlay) {
          overlay.style.display = "none";
        }

      };

    });

}

loadFloatingNotification();


document.addEventListener('DOMContentLoaded', async () => {

    console.log('🚀 script.js cargado');

    const cargado = await cargarSwiperInicio();

    if (cargado) {

        console.log('✅ swiper-data.json conectado correctamente');

        const inicio = document.getElementById('inicio');

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
            '❌ No se pudo cargar el contenido de Inicio'
        );

    }

});


