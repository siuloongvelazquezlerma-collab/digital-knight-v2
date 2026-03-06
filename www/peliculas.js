// Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

window.addEventListener('load', function () {
  const overlay = document.querySelector('.overlay-loader');
  const loader = document.getElementById('loader');

  setTimeout(() => {
    loader.style.opacity = '0'; // Fade out loader spinner

    // Espera a que el spinner se desvanezca
    setTimeout(() => {
      loader.style.display = 'none'; // Oculta spinner

      overlay.classList.add('hidden'); // Aplica opacity: 0 al overlay

      // 🆕 Espera la transición antes de ocultar por completo
      setTimeout(() => {
        overlay.style.display = 'none'; // Remueve del flujo visual después del fade
      }, 800); // Igual al tiempo de la transición CSS
    }, 300); // fade-out del spinner
  }, 1000); // espera inicial
});


const video = document.getElementById('video');
const controls = document.getElementById('controls');
const overlay = document.getElementById('overlay');
const player = document.getElementById('player');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn').querySelector('.material-icons');
const cover = document.getElementById('cover');

document.addEventListener('DOMContentLoaded', async () => {
  // 🔐 Validar usuario actual y limpiar localStorage si es diferente
  const { data: { user } } = await supabase.auth.getUser();
  const lastUserId = localStorage.getItem('last_user_id');

  if (user?.id !== lastUserId) {
    // Limpia solo datos sensibles
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('progress_') || key.startsWith('hasStarted_')) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem('last_user_id', user?.id || '');
    console.log('🧹 Se limpiaron progresos por cambio de usuario');
  }

  // 👇 Desde aquí sigue tu lógica normal (player, loader, etc.)
  window.videoPlayer = videojs('video', {
    controls: false,
    autoplay: false,
    preload: 'auto',
    responsive: true,
    fluid: true
  });

  window.videoPlayer.on('waiting', () => {
    document.getElementById('videoLoader').classList.remove('hidden');
  });

  window.videoPlayer.on('playing', () => {
    document.getElementById('videoLoader').classList.add('hidden');
  });
});



// NUEVO: Elementos para "Reanudar" y "Reinicia"
const watchButtonText = document.getElementById('watchButtonText');
const restartButton = document.getElementById('restartButton');

// NUEVO: Barra visual de progreso
const progressBar = document.getElementById('watchProgressBar');

let hideControlsTimeout;

// Reanudar desde donde se dejó
video.addEventListener('loadedmetadata', async () => {
  let savedTime = localStorage.getItem(`progress_${movieId}`);

  if (!savedTime) {
    // 🔁 Si no hay progreso local, intenta traerlo de Supabase
    const { fetchProgress } = await import('../js/sync-supabase.js');
    const remoteTime = await fetchProgress(movieId);

    if (remoteTime && remoteTime > 5) {
      savedTime = remoteTime;
      localStorage.setItem(`progress_${movieId}`, remoteTime);
    }
  }

  if (savedTime) {
    video.currentTime = parseFloat(savedTime);
  }

  updateProgress();

  if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
    progressBar.style.display = "block";
    showRestartButton();
    watchButtonText.textContent = "Continuar viendo";
  }
});


// Guardar progreso en localStorage
video.addEventListener('timeupdate', async () => {
  updateProgress();
  localStorage.setItem(`progress_${movieId}`, video.currentTime);

  // ✅ Actualizar barra visual de progreso en portada
  if (progressBar && video.duration) {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.firstElementChild?.style.setProperty("width", `${percent}%`);

    if (video.currentTime > 5 && video.currentTime < video.duration - 0.5) {
      if (progressBar.style.display !== "block") {
        progressBar.style.display = "block";
      }
    }
  }

  // ✅ Mostrar botón "Reinicia" si ya pasaron 5s y no ha terminado
  if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
    if (!restartButton.classList.contains('shown')) {
      showRestartButton();
    }
    localStorage.setItem(`hasStarted_${movieId}`, 'true');
  }

  // Cambiar el texto del botón "Ver ahora"
  if (video.currentTime > 10 && watchButtonText.textContent !== "Continuar viendo") {
    watchButtonText.textContent = "Continuar viendo";
  }

  // Ocultar botón y reiniciar estado si terminó la película
  if (video.currentTime >= video.duration - 0.3) {
    hideRestartButton(); // esta función ya hace display = 'none' y quita la clase
    localStorage.removeItem(`hasStarted_${movieId}`);
    localStorage.removeItem(`progress_${movieId}`);

    // Restaurar texto y ocultar barra de progreso
    watchButtonText.textContent = "Ver ahora";
    progressBar.style.display = "none";
    progressBar.firstElementChild.style.width = "0%";
  }

  // 👉 NUEVO: sincronizar con Supabase
  if (video.currentTime > 5 && video.duration && video.currentTime < video.duration - 5) {
    const { syncData } = await import('../js/sync-supabase.js');
    syncData(movieId);
  }
});


// Mostrar botón y cambiar texto si hay progreso
const savedTime = localStorage.getItem(`progress_${movieId}`);
if (savedTime && parseFloat(savedTime) > 10) {
  watchButtonText.textContent = "Continuar viendo";
  restartButton.style.display = "inline-flex";

  const percent = (parseFloat(savedTime) / video.duration) * 100;
  progressBar.style.display = "block";
  progressBar.firstElementChild.style.width = `${percent}%`;
}

// Reiniciar desde el principio
function restartMovie() {
  localStorage.removeItem(`progress_${movieId}`);
  video.currentTime = 0;
  showPlayer();
}








  

function isMobile() {
  return /Mobi|Android|iPhone/i.test(navigator.userAgent);
}

function showPlayer() {
  cover.style.display = 'none';
  player.style.display = 'flex';

  // ⚠️ Esperar hasta que se inicialice video.js
  if (window.videoPlayer) {
    window.videoPlayer.ready(() => {
      window.videoPlayer.play().catch(err => {
        console.warn('⛔ Error al reproducir:', err);
        // Intenta silenciar (algunos navegadores bloquean autoplay con sonido)
        window.videoPlayer.muted(true);
        window.videoPlayer.play().catch(err2 => {
          console.warn('🚫 No se pudo ni silenciado:', err2);
        });
      });
    });
  } else {
    console.warn('⏳ videoPlayer aún no está listo... esperando...');
    const interval = setInterval(() => {
      if (window.videoPlayer) {
        clearInterval(interval);
        showPlayer(); // vuelve a intentar
      }
    }, 200);
  }

  playPauseBtn.textContent = 'pause';
  showControls();
  enterFullscreen();

  if (isMobile() && screen.orientation?.lock) {
    screen.orientation.lock('landscape').catch((err) => {
      console.warn('No se pudo cambiar a landscape:', err);
    });
  }
}



  // Mostrar barra y botón si ya pasaron 5 segundos
  if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
    progressBar.style.display = "block";
    showRestartButton();
  }




player.addEventListener('mousemove', showControls);
player.addEventListener('click', showControls);
player.addEventListener('touchstart', showControls);

function enterFullscreen() {
  if (player.requestFullscreen) {
    player.requestFullscreen();
  } else if (player.webkitRequestFullscreen) {
    player.webkitRequestFullscreen();
  } else if (player.msRequestFullscreen) {
    player.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement;

  if (!isFullscreen) {
    // 🔄 Volver a orientación vertical
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock(); // Algunos navegadores soportan esto
    } else if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch((err) => {
        console.warn('No se pudo volver a portrait:', err);
      });
    }

    if (!video.paused) {
      video.pause();
    }
    playPauseBtn.textContent = 'play_arrow';
    player.style.display = 'none';
    cover.style.display = 'flex';
  }
});


let hasStarted = false;
let reiniciaTimer = null;

video.addEventListener('play', () => {
  if (!hasStarted && video.currentTime < video.duration - 5) {
    hasStarted = true;

    reiniciaTimer = setTimeout(() => {
      if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
        showRestartButton();
        localStorage.setItem(`hasStarted_${movieId}`, 'true');

        // ✅ Mostrar barra también al reproducir
        progressBar.style.display = "block";
      }
    }, 5000);
  }
});



const favoritoBtn = document.getElementById('favoritoBtn');
const favoritoIcon = document.getElementById('favoritoIcon'); // Ícono
const identificador = favoritoBtn.getAttribute('data-identificador');

async function toggleFavorito() {
  const favoritoEnlace = document.getElementById('favoritoEnlace');
  const imagen = document.getElementById('favoritoImagen');
  const nombre = document.getElementById('nombre').textContent;
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

  const identificador = document.getElementById('favoritoBtn')?.getAttribute('data-identificador');
  const favoritoIcon = document.getElementById('favoritoIcon');

  const encontrado = favoritos.some(favorito => favorito.identificador === identificador);

  // 📦 Importar Supabase y crear cliente
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  const supabase = createClient(
    'https://eacgmqikpwzqdmgixtja.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY2dtcWlrcHd6cWRtZ2l4dGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjIwNzYsImV4cCI6MjA4MTA5ODA3Nn0.OUE0PYKVOUtIKQeMebxdy7ALWwHnjiVQPMEOlruPsXg' // tu anon key completa
  );

  // 🧑 Obtener sesión actual
  const { data: { session }, error } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (encontrado) {
    // ❌ Eliminar de localStorage
    const nuevosFavoritos = favoritos.filter(fav => fav.identificador !== identificador);
    localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    favoritoIcon.innerText = 'add';
    mostrarNotificacion('Se eliminó de favoritos');

    // ❌ Eliminar de Supabase si hay sesión
    if (userId) {
      await supabase.from('favoritos')
        .delete()
        .eq('id', userId)
        .eq('identificador', identificador);
    }
  } else {
    // ✅ Agregar a localStorage
    const nuevoFav = {
      identificador,
      imagen: imagen.outerHTML,
      enlace: favoritoEnlace.href,
      nombre
    };
    favoritos.push(nuevoFav);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    favoritoIcon.innerText = 'check';
    mostrarNotificacion('Se añadió a favoritos');

    // ✅ Agregar a Supabase si hay sesión
    if (userId) {
      await supabase.from('favoritos').upsert({
        id: userId,
        identificador,
        nombre,
        imagen: imagen.outerHTML,
        enlace: favoritoEnlace.href
      });
    }
  }

  // 🔄 Lanzar evento personalizado por si estás en la página de favoritos
  window.dispatchEvent(new Event("favoritosActualizados"));
}


// Función para cargar el estado inicial del botón de favoritos
function cargarEstadoFavorito() {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const encontrado = favoritos.some(favorito => favorito.identificador === identificador);

    if (encontrado) {
        // Si está en favoritos, cambia solo el ícono
        favoritoIcon.innerText = 'check';
    } else {
        // Si no está en favoritos, deja el ícono por defecto
        favoritoIcon.innerText = 'add';
    }
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', cargarEstadoFavorito);

function mostrarNotificacion(mensaje) {
  const notificacion = document.getElementById('notificacion');
  const notificacionTexto = document.getElementById('notificacionTexto');

  notificacionTexto.innerText = mensaje;
  notificacion.style.bottom = "80px"; // Justo encima del footer

  setTimeout(() => {
    notificacion.style.bottom = "-200px"; // Oculta fuera del viewport
  }, 3000);
}

// Gestión de imágenes de perfil
const footerProfileIcon = document.getElementById("footerIconImg");
const headerProfileIcon = document.getElementById("headerProfileIcon"); // NUEVO
const profileImage = document.getElementById("profileImage");
const profilePageImage = document.getElementById("profilePageImage");

const defaultProfileIcon = document.getElementById("defaultProfileIcon");
const defaultProfileIconAlt = document.getElementById("defaultProfileIconAlt");

// Función para cambiar todas las imágenes de perfil
function updateProfileImage(src) {
  if (profileImage) profileImage.src = src;
  if (profilePageImage) profilePageImage.src = src;
  if (footerProfileIcon) footerProfileIcon.src = src;
  if (headerProfileIcon) headerProfileIcon.src = src;

  if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
  if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';

  localStorage.setItem('profileImage', src);
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener('load', function () {
  const storedProfileImage = localStorage.getItem('profileImage');
  if (storedProfileImage) {
    if (footerProfileIcon) footerProfileIcon.src = storedProfileImage;
    if (headerProfileIcon) headerProfileIcon.src = storedProfileImage;
    if (profileImage) profileImage.src = storedProfileImage;
    if (profilePageImage) profilePageImage.src = storedProfileImage;

    if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
    if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';
  }
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

const aspectModes = ['cover', 'fill', 'contain', 'fit-height', 'fit-width', 'scale-down'];
let currentAspectIndex = 0;

function toggleAspectRatio() {
  currentAspectIndex = (currentAspectIndex + 1) % aspectModes.length;
  const mode = aspectModes[currentAspectIndex];

  // Aplica el modo al video
  video.style.objectFit = mode.includes('fit-') ? 'contain' : mode;

  // Controla altura y ancho según modo
  switch (mode) {
    case 'fit-height':
      video.style.width = 'auto';
      video.style.height = '100%';
      break;
    case 'fit-width':
      video.style.width = '100%';
      video.style.height = 'auto';
      break;
    default:
      video.style.width = '100%';
      video.style.height = '100%';
      break;
  }

  // Muestra etiqueta en pantalla
  const label = document.getElementById('aspectLabel');
  label.textContent = mode;
  label.style.display = 'block';

  clearTimeout(label._hideTimeout);
  label._hideTimeout = setTimeout(() => {
    label.style.display = 'none';
  }, 1500);
}

const loader = document.getElementById('videoLoader');



  











// Detectar teclas y mover el foco
document.addEventListener('keydown', function(e) {
  const focusable = Array.from(document.querySelectorAll('[tabindex]:not([disabled])'));

  const current = document.activeElement;
  const currentIndex = focusable.indexOf(current);

  switch(e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      if (currentIndex > 0) {
        focusable[currentIndex - 1].focus();
      }
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      if (currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus();
      }
      e.preventDefault();
      break;
    case 'Enter':
    case 'OK':
      if (document.activeElement) {
        document.activeElement.click();
      }
      e.preventDefault();
      break;
  }
});



const tabs = document.querySelector('.tabs-secondary');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY === 0) {
      // En el top, hacer transparente
      tabs.classList.remove('scrolled-up');
    } else if (currentScrollY < lastScrollY) {
      // Deslizando hacia arriba: oscurecer
      tabs.classList.add('scrolled-up');
    } else if (currentScrollY > lastScrollY) {
      // Deslizando hacia abajo: transparente
      tabs.classList.remove('scrolled-up');
    }

    lastScrollY = currentScrollY;
  });

  