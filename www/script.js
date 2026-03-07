



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


function createSwiper(swiperEl) {
  const swiper = new Swiper(swiperEl, {
    loop: false,
    resistanceRatio: 0,
    autoplay: false, // 👈 SIN autoplay al inicio
    pagination: {
      el: swiperEl.querySelector('.swiper-pagination'),
      clickable: true,
    },
    navigation: {
      nextEl: swiperEl.querySelector('.swiper-button-next'),
      prevEl: swiperEl.querySelector('.swiper-button-prev'),
    },
    speed: 1000,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    on: {
      slideChangeTransitionStart(swiper) {
        updateBackground(swiperEl);
    
        // 🕒 Solo la primera transición dura más (14s)
        if (swiper.el.id === "inicio") {
          if (swiper.realIndex === 0) {
            swiper.params.autoplay.delay = 14000;
          } else {
            swiper.params.autoplay.delay = 6000;
          }
          if (swiper.autoplay && swiper.autoplay.running) {
            swiper.autoplay.start(); // aplicar el cambio inmediatamente
          }
        }
    
        // 🛑 Detener autoplay en el último slide
        if (swiper.realIndex === swiper.slides.length - 1) swiper.autoplay.stop();
      }
    }
    
  });
  return swiper;
}


function updateBackground(swiperEl) {
  const activeSlide = swiperEl.querySelector('.swiper-slide-active');
  if (!activeSlide) return;

  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  const bg = isLandscape
    ? activeSlide.style.getPropertyValue('--bg-land')
    : activeSlide.style.getPropertyValue('--bg');
  document.body.style.backgroundImage = bg;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
}



// Oculta los demás de entrada
sections.forEach(swiperEl => {
  if (swiperEl.id !== 'inicio') {
    swiperEl.style.display = 'none';
  }
});

let lastTabId = null;

// --- Función central para activar tab con overlay fade ---
function activateTab(targetId, options = {}) {
  const { skipScroll = false, skipSlideReset = false, skipOverlay = false } = options;

  if (!skipOverlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('show');
  }

  setTimeout(() => {
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
    const targetSwiperEl = document.getElementById(targetId);
    if (targetSwiperEl) {
      targetSwiperEl.style.display = 'block';

      // ⚡ Crear Swiper solo al primer uso
      if (!swiperInstances[targetId]) {
        swiperInstances[targetId] = createSwiper(targetSwiperEl);
      }

      const swiper = swiperInstances[targetId];
      if (swiper) {
        swiper.slideTo(0, 0, false); // 👈 sin animación
        swiper.params.autoplay.delay = 14000;
        swiper.autoplay.start();
      }
      
      updateBackground(targetSwiperEl);
    }

    // Mostrar sección de contenido
    sectionContents.forEach(sectionContent => {
      sectionContent.style.display =
        sectionContent.dataset.section === targetId ? 'block' : 'none';
    });

    // Scroll de la tab
    if (!skipScroll && targetTab) {
      targetTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    if (!skipOverlay) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.classList.add('hidden'), 400);
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








// Simula datos de notificaciones
const mockNotifications = [
  
  
  
  ];
  
  // Simula la llamada a un servidor con setTimeout
  function fetchNotifications() {
  return new Promise((resolve) => {
  setTimeout(() => {
      resolve(mockNotifications); // Simula la respuesta del servidor
  }, 1000); // Simula un retraso de 1 segundo
  });
  }
  
  // Función para cargar notificaciones
  async function loadNotifications() {
  try {
  const notifications = await fetchNotifications();
  
  const notificationsContainer = document.getElementById("notificationsContainer");
  notificationsContainer.innerHTML = ""; // Limpia las notificaciones actuales
  
  if (notifications.length === 0) {
      notificationsContainer.innerHTML = "<p>No hay notificaciones nuevas.</p>";
      return;
  }
  
  notifications.forEach(notification => {
      const notificationElement = createNotificationElement(notification);
      notificationsContainer.appendChild(notificationElement);
  });
  
  updateNotificationBadge(); // Actualiza el badge
  } catch (error) {
  console.error("Error al cargar notificaciones:", error);
  }
  }
  
  // Crear el elemento HTML de la notificación
  function createNotificationElement(notification) {
  const notificationItem = document.createElement("a");
  notificationItem.href = notification.link || "#"; // Enlace por defecto
  notificationItem.className = "notification-item";
  
  notificationItem.innerHTML = `
  <img src="${notification.image}" alt="${notification.title}" class="notification-image">
  <div class="notification-text">
      <h2>${notification.header || "Notificación"}</h2>
      <h3>${notification.title}</h3>
      <p>${notification.body}</p>
  </div>
  `;
  return notificationItem;
  }
  
  // Función para mostrar la sección de notificaciones
  function showNotifications() {
  const notificationsPage = document.getElementById("notificationsPage");
  notificationsPage.classList.remove("hidden");
  updateNotificationBadge(); // Actualiza el badge al abrir la página
  }
  
  // Función para cerrar las notificaciones
  function closeNotifications() {
  const notificationsPage = document.getElementById("notificationsPage");
  notificationsPage.classList.add("hidden");
  updateNotificationBadge(); // Actualiza el badge al cerrar la página
  }
  
  // Función para actualizar el punto rojo en el ícono de notificaciones
  function updateNotificationBadge() {
  const notificationsContainer = document.getElementById("notificationsContainer");
  const notificationItems = notificationsContainer.querySelectorAll(".notification-item");
  const notificationBadge = document.getElementById("notificationBadge");
  
  if (notificationItems.length > 0) {
  notificationBadge.style.display = "flex"; // Muestra el badge
  notificationBadge.textContent = notificationItems.length; // Muestra el número de notificaciones
  } else {
  notificationBadge.style.display = "none"; // Oculta el badge si no hay notificaciones
  }
  }
  
  // Inicializa las notificaciones al cargar la página
  window.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
  updateNotificationBadge();
  });
  
  var container = document.getElementById('continueWatchingContainer');
var continueWatchingSection = document.querySelector('.movie-section.continue-watching');

// Ocultar la sección inicialmente
continueWatchingSection.style.display = 'none';

// Función para renderizar "Continuar Viendo"
function loadContinueWatching() {
  container.innerHTML = '';
  var hasIncompleteItems = false;
  var itemsToRender = [];

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    try {
      var itemData = JSON.parse(localStorage.getItem(key));

      // 🎬 Películas
      if (key.startsWith('movie_') && itemData && itemData.title && itemData.poster && itemData.link && itemData.progress !== undefined) {
        if (itemData.duration !== undefined && itemData.progress < itemData.duration * 0.9) {
          hasIncompleteItems = true;
          itemsToRender.push({ key: key, data: itemData, type: 'movie' });
        }
      }

      // 📺 Series (nuevo formato: continue_{seriesId})
      if (key.startsWith('continue_') && itemData && itemData.seriesTitle && itemData.episodeTitle && itemData.poster && itemData.link && itemData.videoUrl) {
        const progressKey = `progress_${itemData.seriesId}_${itemData.videoUrl}`;
        const durationKey = `duration_${itemData.seriesId}_${itemData.videoUrl}`;

        const latestProgress = parseFloat(localStorage.getItem(progressKey)) || 0;
        const latestDuration = parseFloat(localStorage.getItem(durationKey)) || itemData.duration || 1;

        if (latestProgress < latestDuration * 0.9) {
          hasIncompleteItems = true;
          itemData.progress = latestProgress;
          itemData.duration = latestDuration;

          itemsToRender.push({
            key: key,
            data: itemData,
            type: 'series'
          });
        }
      }

    } catch (e) {
      console.error('Error parsing item data:', e);
    }
  }

  // 🔹 Depuración
  console.log("Items en 'Continuar Viendo':", itemsToRender);

  itemsToRender.reverse(); // Más recientes primero

  // Renderizar en DOM
  // Renderizar en DOM
itemsToRender.forEach(function (item) {
  var itemData = item.data;
  var itemDiv = document.createElement('div');
  itemDiv.classList.add('movie-item');

  // 🔹 Crea el enlace contenedor
  var link = document.createElement('a');
  link.href = itemData.link;
  link.classList.add('continue-card');

  // 🔹 Crea el contenedor de imagen
  var imageWrapper = document.createElement('div');
  imageWrapper.classList.add('image-wrapper');
  imageWrapper.style.position = 'relative';

  var img = document.createElement('img');
  img.src = itemData.poster;
  img.alt = item.type === 'movie' ? itemData.title : itemData.episodeTitle;
  img.classList.add('poster');

  // 🔹 Barra de progreso encima de la imagen
  var progressBarContainer = document.createElement('div');
  progressBarContainer.classList.add('progress-bar-container');

  var progressBar = document.createElement('div');
  progressBar.classList.add('progress-bar');

  let percent = 0;
  if (itemData.duration && itemData.progress !== undefined) {
    percent = Math.min((itemData.progress / itemData.duration) * 100, 100);
  } else {
    percent = itemData.progress || 0;
  }
  progressBar.style.width = percent + '%';

  progressBarContainer.appendChild(progressBar);
  imageWrapper.appendChild(img);
  imageWrapper.appendChild(progressBarContainer);

  link.appendChild(imageWrapper);
  itemDiv.appendChild(link);

  // 🔹 Título y subtítulo debajo de la imagen
  var titleWrapper = document.createElement('div');
  titleWrapper.classList.add('continue-info');

  if (item.type === 'movie') {
    var movieTitle = document.createElement('div');
    movieTitle.textContent = itemData.title || "Sin título";
    movieTitle.classList.add('series-title');

    var movieSubtitle = document.createElement('div');
    movieSubtitle.textContent = itemData.subtitle || "";
    movieSubtitle.classList.add('episode-title');

    titleWrapper.appendChild(movieTitle);
    titleWrapper.appendChild(movieSubtitle);
  } else if (item.type === 'series') {
    var seriesTitle = document.createElement('div');
    seriesTitle.textContent = itemData.seriesTitle || "Sin título";
    seriesTitle.classList.add('series-title');

    var episodeTitle = document.createElement('div');
    episodeTitle.textContent = itemData.episodeTitle || "";
    episodeTitle.classList.add('episode-title');

    titleWrapper.appendChild(seriesTitle);
    titleWrapper.appendChild(episodeTitle);
  }

  itemDiv.appendChild(titleWrapper);

  // 🔹 Botón eliminar
var deleteButton = document.createElement('button');
deleteButton.classList.add('delete-button');

// ✅ Usar ícono material "close"
deleteButton.innerHTML = '<span class="material-icons">close</span>';

deleteButton.addEventListener('click', async function () {
  itemDiv.remove();
  localStorage.removeItem(item.key);

  // 🔄 También eliminar de Supabase
  try {
    const { deleteContinueItemFromSupabase } = await import('../js/sync-supabase.js');

    await deleteContinueItemFromSupabase(item.key);

    console.log('🧹 Eliminado de Supabase:', item.key);
  } catch (e) {
    console.warn('⚠️ No se pudo cargar o ejecutar deleteContinueItemFromSupabase:', e);
  }

  // Ocultar sección si ya no hay ítems
  if (container.children.length === 0) {
    continueWatchingSection.style.display = 'none';
  }
});
itemDiv.appendChild(deleteButton);


  // Evento click para guardar progreso (series)
  img.addEventListener('click', function () {
    const resumeData = {
      type: item.type, // 'movie' o 'series'
      link: itemData.link,
      progress: itemData.progress,
      poster: itemData.poster,
      title: itemData.title || itemData.seriesTitle,
      subtitle: itemData.subtitle || itemData.episodeTitle,
      movieId: itemData.movieId || itemData.seriesId,
      videoUrl: itemData.videoUrl || null
    };
    localStorage.setItem('resumeFromContinue', JSON.stringify(resumeData));
  
    // Redirigir a la página correspondiente
    window.location.href = itemData.link;
  });
  

  container.prepend(itemDiv);
});


  // Mostrar u ocultar la sección
  continueWatchingSection.style.display = hasIncompleteItems ? 'block' : 'none';
}

// Ejecutar al cargar la página
loadContinueWatching();



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
showNotificationOnce("notificationEpisodio", "v6", 2000);
showNotificationOnce("notificationPelicula", "v6", 2500);

if (sessionStorage.getItem("intro_shown")) {
  setTimeout(() => {
    const intro = document.getElementById("opening");
    if (!intro) return;
    intro.classList.add("hide");
    setTimeout(() => intro.remove(), 1200);
  }, 7000);
}


