


// Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Mostrar el loader al cargar la página
window.addEventListener('load', function () {
const loader = document.getElementById('loader');

// Ocultar el loader con transición después de que la página cargue
setTimeout(() => {
    loader.style.opacity = '0'; // Transición para desaparecer
    setTimeout(() => { loader.style.display = 'none'; }, 300); // Ocultar completamente después de la transición
}, 1000); // Mantén el loader visible durante 1 segundo (ajusta según lo necesario)

// Mostrar el contenido del body con la transición
document.body.classList.add('loaded');
});


document.addEventListener('DOMContentLoaded', () => {
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const tabsContainer = document.querySelector('.tabs');

tabs.forEach(tab => {
tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');

    // Quitar la clase 'active' de todas las pestañas y contenidos
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => {
        tc.classList.remove('active');
        tc.style.opacity = 0;
        const track = tc.querySelector('.carousel-track');
        if (track) {
            track.style.transform = 'translateX(0)';
            track.stopAutoScroll(); // Detener carrusel al cambiar de pestaña
        }
        // Reiniciar los indicadores
        const indicators = tc.querySelectorAll('.indicator');
        indicators.forEach(indicator => indicator.classList.remove('active'));
    });

    // Agregar la clase 'active' a la pestaña y al contenido correspondiente
    tab.classList.add('active');
    const activeContent = document.getElementById(tabId);
    activeContent.classList.add('active');
    setTimeout(() => {
        activeContent.style.opacity = 1;
    }, 50);

    // Inicia el desplazamiento hacia la pestaña activa a partir de "Series"
    if (["tab3", "tab4", "tab5", "tab6"].includes(tabId)) {
        scrollToActiveTab(tab);
    }

   
});
});


document.addEventListener("DOMContentLoaded", function() {
    // Datos para Portrait
    const portraitData = [
      {
        img: "https://od.lk/s/M18zMTE4NjY1NTVf/new%20dragon%20ball%20z%20poster.png",
        logo: "https://image.tmdb.org/t/p/original/vw9Nt8aftq4fepr8vK6HsF8jWcm.png",
        meta: "Serie · 4 sagas · 1989",
        description: "Es la continuación de la serie de anime 'Dragon Ball'. Se divide básicamente en cuatro sagas.",
        link: "dragon-ball-z.html"
      },
      {
        img: "https://od.lk/s/M18zMTIwMTk5MTRf/Drag%C3%B3n%20ball%20Z%20%28el%20renacer%20de%20la%20fusi%C3%B3n%29%20goku%20y%20vegeta%20primera%20aparici%C3%B3n%204%20de%20marzo%20de%201995.jpeg",
        logo: "https://od.lk/s/M18zMDExMjUzOThf/FUSION.png",
        meta: "Película · 1995",
        description: "El universo se ve sumido en un caos dimensional cuando los muertos vuelven a la vida.",
        link: "Dragon Ball Z La fusion de Goku y Vegeta.html"
      }
      // Puedes agregar más imágenes
    ];
  
    // Datos para Landscape
    const landscapeData = [
      {
        img: "https://od.lk/s/M18zMTE4NjYyODBf/dragon%20ball%20z%20fondo.png",
        logo: "https://image.tmdb.org/t/p/original/vw9Nt8aftq4fepr8vK6HsF8jWcm.png",
        meta: "Serie · 4 sagas · 1989",
        description: "Es la continuación de la serie de anime 'Dragon Ball'. Se divide básicamente en cuatro sagas.",
        link: "dragon-ball-z.html"
      },
      {
        img: "https://image.tmdb.org/t/p/original/5seSw3hQTFSYzdh6kHOSAmExUA.jpg",
        logo: "https://od.lk/s/M18zMDExMjUzOThf/FUSION.png",
        meta: "Película · 1995",
        description: "El universo se ve sumido en un caos dimensional cuando los muertos vuelven a la vida.",
        link: "Dragon Ball Z La fusion de Goku y Vegeta.html"
      }
      // Puedes agregar más imágenes
    ];
  
    const THREE_HOURS_MS = 10800000; // 3 horas
  
    const portraitItem = document.querySelector('#tab1 .carousel-item:not(.landscape-only)');
    const portraitImg = portraitItem.querySelector('img');
    const portraitLogo = portraitItem.querySelector('.logo-overlay img');
    const portraitMeta = portraitItem.querySelector('.meta');
    const portraitDescription = portraitItem.querySelector('.description');
    const portraitLink = portraitItem.querySelector('a');
  
    const landscapeItem = document.querySelector('#tab1 .carousel-item.landscape-only');
    const landscapeImg = landscapeItem.querySelector('img');
    const landscapeLogo = landscapeItem.querySelector('.logo-overlay img');
    const landscapeMeta = landscapeItem.querySelector('.meta');
    const landscapeDescription = landscapeItem.querySelector('.description');
    const landscapeLink = landscapeItem.querySelector('a');
  
    function updateImages(portraitIndex, landscapeIndex) {
      // Cambiar contenido portrait
      const p = portraitData[portraitIndex % portraitData.length];
      portraitImg.src = p.img;
      portraitLogo.src = p.logo;
      portraitMeta.textContent = p.meta;
      portraitDescription.textContent = p.description;
      portraitLink.href = p.link;
  
      // Cambiar contenido landscape
      const l = landscapeData[landscapeIndex % landscapeData.length];
      landscapeImg.src = l.img;
      landscapeLogo.src = l.logo;
      landscapeMeta.textContent = l.meta;
      landscapeDescription.textContent = l.description;
      landscapeLink.href = l.link;
    }
  
    function initialize() {
      const lastPortraitChange = localStorage.getItem('lastPortraitChange');
      const lastLandscapeChange = localStorage.getItem('lastLandscapeChange');
      const now = Date.now();
  
      let portraitIndex = 0;
      let landscapeIndex = 0;
  
      if (lastPortraitChange) {
        const portraitElapsed = now - parseInt(lastPortraitChange, 10);
        portraitIndex = Math.floor(portraitElapsed / THREE_HOURS_MS) % portraitData.length;
      }
      if (lastLandscapeChange) {
        const landscapeElapsed = now - parseInt(lastLandscapeChange, 10);
        landscapeIndex = Math.floor(landscapeElapsed / THREE_HOURS_MS) % landscapeData.length;
      }
  
      updateImages(portraitIndex, landscapeIndex);
    }
  
    function setTimers() {
      setInterval(() => {
        const now = Date.now();
        localStorage.setItem('lastPortraitChange', now.toString());
        localStorage.setItem('lastLandscapeChange', now.toString());
        initialize(); // actualiza basado en nuevo tiempo
      }, THREE_HOURS_MS);
    }
  
    initialize();
    setTimers();
  
    // Para pruebas rápidas (comentarlo en producción)
    // setInterval(() => {
    //   const now = Date.now();
    //   localStorage.setItem('lastPortraitChange', now.toString());
    //   localStorage.setItem('lastLandscapeChange', now.toString());
    //   initialize();
    // }, 5000); // 5 segundos para testear
  });


// Oscurecer header y carruseles al hacer scroll
const header = document.querySelector("header");
const nav = document.querySelector("nav");
const carouselItems = document.querySelectorAll(".carousel .carousel-item");
const darkOverlay = document.querySelector(".carousel .dark-overlay");
let lastScrollTop = 0;

window.addEventListener("scroll", () => {
const scrollTop = window.scrollY;

// Oscurecer el header completamente cuando se haga scroll
if (scrollTop > 50) {
    header.classList.add("scrolled");
    darkOverlay.style.background = "rgba(11, 26, 54, 0)"; // Oscurecer el overlay del carrusel
    carouselItems.forEach(item => item.classList.add("scrolled")); // Oscurecer las imágenes
} else {
    header.classList.remove("scrolled");
    darkOverlay.style.background = "rgba(0, 0, 0, 0)"; // Restaurar overlay transparente
    carouselItems.forEach(item => item.classList.remove("scrolled")); // Restaurar brillo de las imágenes
}

// Oscurecer carruseles adicionales dentro de tabs
const allCarousels = document.querySelectorAll('.carousel');
allCarousels.forEach(carousel => {
    if (scrollTop > 50) {
        carousel.style.filter = "brightness(70%)"; // Oscurecer el carrusel
    } else {
        carousel.style.filter = "brightness(100%)"; // Restaurar brillo
    }
});

// Ocultar el menú cuando se desplaza hacia abajo
if (scrollTop > lastScrollTop && scrollTop > 50) {
    nav.classList.add("hidden");
} else {
    nav.classList.remove("hidden");
}

lastScrollTop = scrollTop;
});


});





document.addEventListener('DOMContentLoaded', () => {
const footerIcons = document.querySelectorAll('.footer-icon');

footerIcons.forEach(icon => {
icon.addEventListener('click', () => {
    footerIcons.forEach(i => i.classList.remove('active')); // Elimina la clase activa de todos los iconos
    icon.classList.add('active'); // Añade la clase activa solo al icono seleccionado
});
});
});
document.addEventListener('DOMContentLoaded', () => {
const tabs = document.querySelectorAll('.tab'); // Selector para las pestañas
const loader = document.getElementById('loader');

tabs.forEach(tab => {
tab.addEventListener('click', (event) => {
    event.preventDefault();
    loader.style.display = 'block'; // Asegura que esté visible para la transición
    setTimeout(() => { loader.style.opacity = '1'; }, 20); // Inicia transición con un pequeño retardo

    setTimeout(() => {
        // Aquí puedes añadir la lógica para cambiar de pestaña

        loader.style.opacity = '0'; // Oculta el loader con transición
        setTimeout(() => { loader.style.display = 'none'; }, 300); // Desactiva después de la transición
    }, 3000); // Ajusta el tiempo según la transición real
});
});
});


// Gestión de imágenes de perfil
const footerProfileIcon = document.getElementById("footerIconImg");
const profileImage = document.getElementById("profileImage");
const profilePageImage = document.getElementById("profilePageImage");

const defaultProfileIcon = document.getElementById("defaultProfileIcon"); // Icono de perfil en el footer
const defaultProfileIconAlt = document.getElementById("defaultProfileIconAlt"); // Icono alternativo de perfil

// Función para cambiar todas las imágenes de perfil
function updateProfileImage(src) {
profileImage.src = src;
profilePageImage.src = src;
footerProfileIcon.src = src;
defaultProfileIcon.style.display = 'none'; // Ocultar el icono de perfil
defaultProfileIconAlt.style.display = 'none'; // Ocultar el icono alternativo
localStorage.setItem('profileImage', src); // Guardar la imagen en el almacenamiento local
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener('load', function () {
const storedProfileImage = localStorage.getItem('profileImage');
if (storedProfileImage) {
footerProfileIcon.src = storedProfileImage;
profileImage.src = storedProfileImage;
profilePageImage.src = storedProfileImage;
defaultProfileIcon.style.display = 'none'; // Ocultar el icono de perfil
defaultProfileIconAlt.style.display = 'none'; // Ocultar el icono alternativo
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

// Contenedor de la sección "Continuar Viendo"
var container = document.getElementById('continueWatchingContainer');
var continueWatchingSection = document.querySelector('.movie-section.continue-watching');

// Ocultar la sección inicialmente
continueWatchingSection.style.display = 'none';

// Función para renderizar los elementos de "Continuar Viendo"
function loadContinueWatching() {
    container.innerHTML = '';
    var hasIncompleteItems = false;
    var itemsToRender = [];

    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        try {
            var itemData = JSON.parse(localStorage.getItem(key));

            // ✅ Películas
            if (itemData && itemData.title && itemData.poster && itemData.link && itemData.progress !== undefined) {
                if (itemData.progress < 100) {
                    hasIncompleteItems = true;
                    itemsToRender.push({ key: key, data: itemData, type: 'movie' });
                }
            }

            // ✅ Series (formato antiguo con progress_)
            if (
                key.startsWith('progress_') &&
                itemData &&
                itemData.seriesId &&
                itemData.seriesTitle &&
                itemData.episodeTitle &&
                itemData.poster &&
                itemData.seriesLink &&
                itemData.progress < 100
            ) {
                hasIncompleteItems = true;
                itemsToRender.push({ key: key, data: itemData, type: 'series' });
            }

            // ✅ Series (nuevo formato: continue_{seriesId})
            if (
                key.startsWith('continue_') &&
                itemData &&
                itemData.seriesTitle &&
                itemData.episodeTitle &&
                itemData.poster &&
                itemData.link &&
                itemData.videoUrl
              ) {
                  const progressKey = `progress_${itemData.seriesId}_${itemData.videoUrl}`;
                  const durationKey = `duration_${itemData.seriesId}_${itemData.videoUrl}`;
              
                  const latestProgress = parseFloat(localStorage.getItem(progressKey)) || 0;
                  const latestDuration = parseFloat(localStorage.getItem(durationKey)) || itemData.duration || 1;
              
                  if (latestProgress < latestDuration * 0.9) {
                      hasIncompleteItems = true;
                      itemData.progress = latestProgress;
                      itemData.duration = latestDuration;
              
                      itemsToRender.push({
                          key: key, // 👈 AQUÍ va el original (continue_...)
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

    // Ordenar más recientes primero
    itemsToRender.reverse();

    // Renderizar en el DOM
    itemsToRender.forEach(function (item) {
        var itemData = item.data;
        var itemDiv = document.createElement('div');
        itemDiv.classList.add('movie-item');

        // Imagen
        var img = document.createElement('img');
        img.src = itemData.poster;
        img.alt = item.type === 'movie' ? itemData.title : itemData.episodeTitle;
        img.classList.add('poster');

        // 👉 Guardar episodio para reanudar al entrar a la serie
        img.addEventListener('click', function () {
            if (item.type === 'series') {
                localStorage.setItem('resumeFromContinue', JSON.stringify({
                    seriesId: itemData.seriesId || null,
                    episodeTitle: itemData.episodeTitle,
                    progress: itemData.progress,
                    link: itemData.seriesLink || itemData.link,
                    poster: itemData.poster,
                    seriesTitle: itemData.seriesTitle
                }));
            }
        });

        // Enlace
        var link = document.createElement('a');
        link.href = item.type === 'movie' ? itemData.link : itemData.seriesLink || itemData.link;
        link.classList.add('continue-card');
        link.appendChild(img);
        itemDiv.appendChild(link);

        // Barra de progreso
var progressBarContainer = document.createElement('div');
progressBarContainer.classList.add('progress-bar-container');

var progressBar = document.createElement('div');
progressBar.classList.add('progress-bar');

let progressValue = itemData.progress;
let durationValue = itemData.duration;

// Si hay duración, es una serie: calculamos el porcentaje
if (durationValue && progressValue !== undefined) {
    const percent = Math.min((progressValue / durationValue) * 100, 100);
    progressBar.style.width = percent + '%';
} else {
    // Si no hay duración, asumimos que progress es un porcentaje (película)
    progressBar.style.width = progressValue + '%';
}

progressBarContainer.appendChild(progressBar);
itemDiv.appendChild(progressBarContainer);



    

        // Título
        var itemTitle = document.createElement('div');
        itemTitle.classList.add('movie-title');
        itemTitle.textContent = item.type === 'movie'
            ? itemData.title
            : `${itemData.seriesTitle} - ${itemData.episodeTitle}`;
        itemDiv.appendChild(itemTitle);

        // Botón de eliminar
        var deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'X';
        deleteButton.addEventListener('click', function () {
            itemDiv.remove();
            localStorage.removeItem(item.key);
            if (container.children.length === 0) {
                continueWatchingSection.style.display = 'none';
            }
        });
        itemDiv.appendChild(deleteButton);

        container.prepend(itemDiv);
    });

    // Mostrar u ocultar la sección según corresponda
    continueWatchingSection.style.display = hasIncompleteItems ? 'block' : 'none';
}

// ✅ Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('justReturnedFromSeries') === 'true') {
        localStorage.removeItem('justReturnedFromSeries');
        loadContinueWatching(); // 🔁 Repinta con progreso actualizado
    } else {
        loadContinueWatching(); // Primera carga normal
    }
});

// Identificador de la notificación (CAMBIA ESTO cuando publiques otra nueva)
var notificationID = "notification_v23"; // Cambia a "notification_v2" cuando publiques otra

document.addEventListener("DOMContentLoaded", function () {
    // Verifica si la notificación ya fue cerrada por el usuario
    if (localStorage.getItem("dismissedNotification") !== notificationID) {
        document.getElementById("floatingNotification").style.display = "block";
    }
});

function closeFloatingNotification() {
    document.getElementById("floatingNotification").style.display = "none";
    // Guarda en localStorage que esta notificación ya fue cerrada
    localStorage.setItem("dismissedNotification", notificationID);
}

document.getElementById("telegramLink").addEventListener("click", function(event) {
    event.preventDefault();
    var link = "tg://join?invite=dYQgTE46E6Y3MWFh"; 
    window.location.href = link;
    setTimeout(function() {
        window.location.href = "https://t.me/+dYQgTE46E6Y3MWFh"; 
    }, 1000);
});
 