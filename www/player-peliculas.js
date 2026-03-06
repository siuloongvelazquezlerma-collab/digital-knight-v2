
// Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });



const video = document.getElementById('video');
const controls = document.getElementById('controls');
const overlay = document.getElementById('overlay');
const player = document.getElementById('player');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn').querySelector('.material-icons');
const cover = document.getElementById('cover');
const thumb = document.getElementById('thumb'); // si existe


/* =============================
   🔥 INTEGRACIÓN CON EL VIDEO
============================= */

// Activar WakeLock cuando empieza
video.addEventListener("play", () => {
  requestWakeLock();
});

// Reintentar cuando pone fullscreen
video.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    requestWakeLock();
  }
});

// Quitar WakeLock al pausar
video.addEventListener("pause", () => {
  releaseWakeLock();
});

// Quitar WakeLock al terminar
video.addEventListener("ended", () => {
  releaseWakeLock();
});


 // o la ruta que uses

async function syncMovieProgress() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // si no hay sesión, no sincronizamos

  const movieId = window.movieId;
  const currentTime = video.currentTime || 0;
  const totalDuration = video.duration || 1;
  const progressPercent = currentTime / totalDuration;

  // Datos que ya tienes en la página
  const title = document.querySelector(".title")?.textContent?.trim() || "Sin título";
  const poster = document.getElementById("favoritoImagen")?.src || "";
  const link = window.location.href;

  try {
    await supabase.from('progresos').upsert({
      id: user.id,
      movie_id: movieId,
      progress: progressPercent,
      duration: totalDuration,
      title,
      poster,
      link,
      updated_at: new Date().toISOString(),
    });

    console.log(`🛰️ Progreso sincronizado con Supabase (${(progressPercent * 100).toFixed(1)}%)`);
  } catch (error) {
    console.error('❌ Error al sincronizar progreso con Supabase:', error);
  }
}

let lastSyncTime = 0;



// ------------------------
// ------------------------
// 2️⃣ Función para actualizar barra y thumb
// ------------------------
function updateMovieProgress() {
  if (!video.duration) return;

  const remaining = video.duration - video.currentTime;
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60).toString().padStart(2, '0');

  duration.textContent = hours > 0
    ? `- ${hours}:${minutes.toString().padStart(2,'0')}:${seconds}`
    : `- ${minutes}:${seconds}`;

  const percent = (video.currentTime / video.duration) * 100;

  progress.value = percent;
  progress.style.background = `linear-gradient(to right, white ${percent}%, #666 ${percent}%)`;

  if (thumb) {
    const width = progress.offsetWidth;
    thumb.style.left = `${(percent / 100) * width}px`;
  }
}


// 🧩 Buffer real del video
function updateBufferBar() {
  if (!video.buffered || video.buffered.length === 0 || !video.duration) return;

  try {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const percent = (bufferedEnd / video.duration) * 100;

    // Actualiza el ancho del buffer visual
    document.querySelector(".progress").style.setProperty("--buffer-width", `${percent}%`);
  } catch (err) {
    console.warn("No se pudo leer buffer:", err);
  }
}

// ⚡ Refrescado continuo del buffer (más fluido)
function smoothBufferUpdate() {
  updateBufferBar();
  if (!video.paused && !video.ended) {
    requestAnimationFrame(smoothBufferUpdate);
  }
}

// Escuchar eventos principales (mantiene la precisión inicial)
video.addEventListener("progress", updateBufferBar);
video.addEventListener("loadedmetadata", updateBufferBar);

// 🌀 Movimiento fluido del progreso + buffer
function smoothProgressUpdate() {
  updateMovieProgress();
  if (!video.paused && !video.ended && video.duration) {
    requestAnimationFrame(smoothProgressUpdate);
  }
}

// Activar animaciones al reproducir
video.addEventListener("play", () => {
  requestAnimationFrame(smoothProgressUpdate);
  requestAnimationFrame(smoothBufferUpdate);
});

// Mantener sincronización en pausas o saltos
video.addEventListener("pause", () => {
  updateMovieProgress();
  updateBufferBar();
});
video.addEventListener("seeking", updateMovieProgress);


// Mantener sincronización en pausas o saltos
video.addEventListener("pause", updateMovieProgress);
video.addEventListener("seeking", updateMovieProgress);
// ------------------------
// 3️⃣ Listeners del progreso
// ------------------------
progress.addEventListener('input', () => {
  video.currentTime = (progress.value / 100) * video.duration;
  updateMovieProgress(); // actualiza thumb en tiempo real
});

video.addEventListener('timeupdate', updateMovieProgress);
video.addEventListener('loadedmetadata', updateMovieProgress);
video.addEventListener('play', () => requestAnimationFrame(updateMovieProgress));
video.addEventListener('pause', updateMovieProgress);
// NUEVO:  para "Reanudar" y "Reinicia"
const watchButtonText = document.getElementById('watchButtonText');
const restartButton = document.getElementById('restartButton');

// NUEVO: Barra visual de progreso
const progressBar = document.getElementById('watchProgressBar');

let hideControlsTimeout;

// Reanudar desde donde se dejó
// Reanudar desde donde se dejó
video.addEventListener('loadedmetadata', () => {
  const savedTime = localStorage.getItem(`progress_${movieId}`);
  if (savedTime) {
    video.currentTime = parseFloat(savedTime);
  }
  updateProgress();

  // ✅ Mostrar barra y botón si aplica
  if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
    progressBar.style.display = "block";
    showRestartButton();
    watchButtonText.textContent = "Continuar viendo";
  }

  // 🛰️ Sincronizar con Supabase al cargar metadata
  if (typeof throttledSyncData === 'function') {
    throttledSyncData(movieId);
  }
});

let lastSync = 0; // Estado inicial del botón al cargar la página
updateWatchButtonFromStorage();

// Guardar progreso y actualizar UI
video.addEventListener('timeupdate', () => {
  updateProgress();

  const currentTime = video.currentTime;
  const totalDuration = video.duration || 1;

  // Guardar en localStorage
  localStorage.setItem(`progress_${movieId}`, currentTime);
  localStorage.setItem(`duration_${movieId}`, totalDuration);
  localStorage.setItem(`movie_${movieId}`, JSON.stringify({
    tipo: 'movie',
    title: document.querySelector(".title")?.textContent?.trim() || 'Sin título',
    subtitle: document.getElementById("episodeSubtitle")?.textContent?.trim() || '',
    poster: document.getElementById("favoritoImagen")?.src || '',
    link: document.getElementById("favoritoEnlace")?.href || window.location.href,
    progress: currentTime,
    duration: totalDuration
  }));

  // Sincronizar cada 5 segundos
  const now = Date.now();
  if (typeof throttledSyncData === 'function' && now - lastSync > 5000) {
    throttledSyncData(movieId);
    lastSync = now;
  }

  // Barra de progreso
  if (progressBar && totalDuration) {
    const percent = (currentTime / totalDuration) * 100;
    progressBar.firstElementChild?.style.setProperty("width", `${percent}%`);

    if (currentTime > 5 && currentTime < totalDuration - 0.5) {
      progressBar.style.display = "block";
    }
  }

  // Botón reiniciar
  if (currentTime > 5 && currentTime < totalDuration - 5) {
    showRestartButton();
    localStorage.setItem(`hasStarted_${movieId}`, 'true');
  }

  // Cambiar texto del botón
  const percentPlayed = currentTime / totalDuration;
  if (percentPlayed >= 0.8) {
    watchButtonText.textContent = "Volver a ver";
  } else if (currentTime > 10) {
    watchButtonText.textContent = "Continuar viendo";
  } else {
    watchButtonText.textContent = "Ver ahora";
  }
});

// Evento final real
video.addEventListener('ended', () => {
  endMovieCleanup(true); // 🔹 Indicamos que terminó al 100%
});

// Limpieza del estado
function endMovieCleanup(finished = false) {
  exitFullscreen();
  player.style.display = 'none';
  cover.style.display = 'flex';
  video.pause();
  playPauseBtn.textContent = 'play_arrow';
  progressBar.style.display = 'none';
  hideRestartButton();

  if (finished) {
    // Solo limpiar progreso si de verdad terminó
    localStorage.removeItem(`progress_${movieId}`);
    localStorage.removeItem(`hasStarted_${movieId}`);
    progressBar.firstElementChild.style.width = "0%";
  }

  // 🔹 Siempre actualizar el botón al cerrar el reproductor
  updateWatchButtonFromStorage();
}

// Nueva función que actualiza el botón y la barra según progreso
function updateWatchButton() {
  const savedTime = parseFloat(localStorage.getItem(`progress_${movieId}`) || "0");
  const totalDuration = parseFloat(localStorage.getItem(`duration_${movieId}`) || video.duration || 1);
  const currentTime = video.currentTime || 0;

  const effectiveTime = Math.max(savedTime, currentTime);

  // Actualizar el texto del botón según el progreso
  if (effectiveTime >= totalDuration * 0.9) {
    watchButtonText.textContent = "Volver a ver";
    restartButton.style.display = "inline-flex";
    progressBar.style.display = "block";
  } else if (effectiveTime > 5) {
    watchButtonText.textContent = "Continuar viendo";
    restartButton.style.display = "inline-flex";
    progressBar.style.display = "block";
  } else {
    watchButtonText.textContent = "Ver ahora";
    restartButton.style.display = "none";
    progressBar.style.display = "none";
  }

  // Actualizar barra de progreso
  if (progressBar && totalDuration) {
    const percent = (effectiveTime / totalDuration) * 100;
    progressBar.firstElementChild.style.width = `${percent}%`;
  }
}

// Llamadas a la función en distintos momentos del video
video.addEventListener('loadedmetadata', updateWatchButton);
video.addEventListener('timeupdate', updateWatchButton);
video.addEventListener('play', updateWatchButton);


// Tu función existente para mantener compatibilidad con el almacenamiento
// Nueva función que actualiza el botón y la barra según progreso
// Nueva función que actualiza el botón y la barra según progreso
function updateWatchButton() {
  const savedTime = parseFloat(localStorage.getItem(`progress_${movieId}`) || "0");
  const totalDuration = parseFloat(localStorage.getItem(`duration_${movieId}`) || video.duration || 1);
  const currentTime = video.currentTime || 0;

  const effectiveTime = Math.max(savedTime, currentTime);

  if (effectiveTime >= totalDuration * 0.9) {
    // Caso: Volver a ver
    watchButtonIcon.textContent = "replay";   // 👈 Cambié restart_alt por replay
    watchButtonText.textContent = "Volver a ver";
    restartButton.style.display = "none";     // 👈 Oculto el botón extra
    progressBar.style.display = "block";
  } else if (effectiveTime > 5) {
    // Caso: Continuar viendo
    watchButtonIcon.textContent = "play_arrow";
    watchButtonText.textContent = "Continuar viendo";
    restartButton.style.display = "inline-flex"; // 👈 Aquí sí se ve
    progressBar.style.display = "block";
  } else {
    // Caso: Ver ahora
    watchButtonIcon.textContent = "play_arrow";
    watchButtonText.textContent = "Ver ahora";
    restartButton.style.display = "none";
    progressBar.style.display = "none";
  }

  // Barra de progreso
  if (progressBar && totalDuration) {
    const percent = (effectiveTime / totalDuration) * 100;
    progressBar.firstElementChild.style.width = `${percent}%`;
  }
}

// Llamadas a la función en distintos momentos del video
video.addEventListener('loadedmetadata', updateWatchButton);
video.addEventListener('timeupdate', updateWatchButton);
video.addEventListener('play', updateWatchButton);


// Función para mantener compatibilidad con almacenamiento
function updateWatchButtonFromStorage() {
  const savedTime = parseFloat(localStorage.getItem(`progress_${movieId}`) || "0");
  const savedDuration = parseFloat(localStorage.getItem(`duration_${movieId}`) || "1");

  if (savedTime > 10) {
    const percentPlayed = savedTime / savedDuration;
    if (percentPlayed >= 0.9) {
      // Caso: Volver a ver
      watchButtonIcon.textContent = "replay";   // 👈 Cambiado
      watchButtonText.textContent = "Volver a ver";
      restartButton.style.display = "none";     // 👈 Oculto
    } else {
      // Caso: Continuar viendo
      watchButtonIcon.textContent = "play_arrow";
      watchButtonText.textContent = "Continuar viendo";
      restartButton.style.display = "inline-flex";
    }
    progressBar.style.display = "block";
    progressBar.firstElementChild.style.width = `${(savedTime / savedDuration) * 100}%`;
  } else {
    // Caso: Ver ahora
    watchButtonIcon.textContent = "play_arrow";
    watchButtonText.textContent = "Ver ahora";
    restartButton.style.display = "none";
    progressBar.style.display = "none";
  }
}

// Botón principal
document.getElementById('watchButton').addEventListener('click', () => {
  if (watchButtonText.textContent.includes("Volver a ver")) {
    restartMovie();
  } else {
    showPlayer();
  }
});

// Reiniciar
function restartMovie() {
  localStorage.removeItem(`progress_${movieId}`);
  video.currentTime = 0;
  showPlayer();
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(err => {
      console.warn('⚠️ No se pudo bloquear orientación en restart:', err);
    });
  }
}







function togglePlay() {
  if (video.paused) {
    video.play();
    playPauseBtn.textContent = 'pause';
    overlay.classList.remove('visible');
  } else {
    video.pause();
    playPauseBtn.textContent = 'play_arrow';
    overlay.classList.add('visible');
  }
}

function skip(seconds) {
  video.currentTime += seconds;
}

function goBack() {
  if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
    exitFullscreen();
  }

  player.style.display = 'none';
  cover.style.display = 'flex';
  video.pause();
  playPauseBtn.textContent = 'play_arrow';
}

function updateProgress() {
  if (video.duration) {
    const remaining = video.duration - video.currentTime;

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = Math.floor(remaining % 60).toString().padStart(2, '0');

    const formattedTime = hours > 0
      ? `- ${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
      : `- ${minutes}:${seconds}`;

    duration.textContent = formattedTime;

    const percent = (video.currentTime / video.duration) * 100;
    progress.value = percent;
    progress.style.background = `linear-gradient(to right, white ${percent}%, #666 ${percent}%)`;
  }
}

progress.addEventListener('input', () => {
  video.currentTime = (progress.value / 100) * video.duration;
});

/* -------------------
   👇 Gestión de controles
------------------- */
let controlsVisible = false;

/* -------------------
   Ajuste de toggleControls
------------------- */
function toggleControls() {
  if (controlsVisible) {
    // 👇 Si ya están visibles → ocultarlos
    hideControls();
    clearTimeout(hideControlsTimeout);
  } else {
    // 👇 Si están ocultos → mostrarlos y reiniciar timeout
    showControls();
  }
}

const overlayTop = document.getElementById('overlayTop');
const overlayBottom = document.getElementById('overlayBottom');

function showControls() {
  controls.classList.remove('hidden');
  overlay.classList.add('visible');
  overlayTop.classList.add('visible');
  overlayBottom.classList.add('visible');
  controlsVisible = true;

  clearTimeout(hideControlsTimeout);
  hideControlsTimeout = setTimeout(() => {
    hideControls();
  }, 5000);
}

function hideControls() {
  controls.classList.add('hidden');
  overlay.classList.remove('visible');
  overlayTop.classList.remove('visible');
  overlayBottom.classList.remove('visible');
  controlsVisible = false;
}



/* -------------------
   Detectar si es táctil o desktop
------------------- */
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  // 👉 En móviles: tap alterna los controles SIN ghost click
  let lastTouch = 0;

  video.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return; // ignora gestos multi-touch
    e.preventDefault();               // evita que luego dispare click
    e.stopPropagation();
    lastTouch = Date.now();
    toggleControls();                 // alterna inmediatamente al tocar
  }, { passive: false });

  // 🚫 Bloquear el click fantasma que llega tras el touch
  video.addEventListener('click', (e) => {
    if (Date.now() - lastTouch < 500) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, true); // usar captura para interceptarlo primero
} else {
  // 👉 En PC: mousemove muestra controles y activa auto-ocultar cursor
  video.addEventListener('mousemove', () => {
    showControls();
    enableCursorAutoHide(); // <-- ocultar cursor
  });

  /* -------------------
     Ocultar cursor en PC
  ------------------- */
  let mouseMoveTimeout;

  function enableCursorAutoHide() {
    // mostrar cursor al mover el mouse
    document.body.style.cursor = "default";
    clearTimeout(mouseMoveTimeout);

    mouseMoveTimeout = setTimeout(() => {
      // 👉 Solo ocultar si el video está reproduciéndose
      if (!video.paused) {
        document.body.style.cursor = "none";
      }
    }, 3000); // 3 segundos sin mover → ocultar
  }

  // Cuando se pausa el video → mostrar cursor siempre
  video.addEventListener('pause', () => {
    document.body.style.cursor = "default";
    clearTimeout(mouseMoveTimeout);
  });

  // Cuando se reproduce → activar auto-hide
  video.addEventListener('play', enableCursorAutoHide);
}

function showPlayer() {
  cover.style.display = 'none';
  player.style.display = 'flex';
  video.play();
  playPauseBtn.textContent = 'pause';
  showControls();
  enterFullscreen();

  // ✅ FORZAR ORIENTACIÓN A LANDSCAPE
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(err => {
      console.warn('⚠️ No se pudo bloquear orientación:', err);
    });
  }

  // ✅ Mostrar barra y botón si ya pasaron 5 segundos
  if (video.currentTime > 5 && video.currentTime < video.duration - 5) {
    progressBar.style.display = "block";
    showRestartButton();
  }
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
        progressBar.style.display = "block";
      }
    }, 5000);

    // 🆕 Forzar fullscreen la primera vez que empieza
    enterFullscreen();
  }
});


// Función para mostrar el botón de "Reinicia"
function showRestartButton() {
  const currentTime = video.currentTime;
  const totalDuration = video.duration || parseFloat(localStorage.getItem(`duration_${movieId}`) || "1");
  const percentPlayed = currentTime / totalDuration;

  // Solo mostrar si la película NO terminó (menos de 90%)
  if (percentPlayed < 0.8) {
    restartButton.style.display = 'flex';
    restartButton.classList.add('shown');
    document.getElementById('restartSpacer').style.height = '60px'; // ajusta según el alto del botón
  } else {
    hideRestartButton();
  }
}

function hideRestartButton() {
  restartButton.style.display = 'none';
  restartButton.classList.remove('shown');
  document.getElementById('restartSpacer').style.height = '0px';
}

function actualizarMediaSession() {
  if (!('mediaSession' in navigator)) return;

  try {
    const titulo =
      document.getElementById('nombre')?.textContent || 'Reproduciendo';

    const posterEl = document.getElementById('favoritoImagen');
    const poster = posterEl?.src;
    if (!poster) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: titulo,
      artist: 'Digital Knight',
      album: 'Películas',
      artwork: [
        { src: poster, sizes: '96x96', type: 'image/jpeg' },
        { src: poster, sizes: '128x128', type: 'image/jpeg' },
        { src: poster, sizes: '192x192', type: 'image/jpeg' },
        { src: poster, sizes: '256x256', type: 'image/jpeg' },
        { src: poster, sizes: '384x384', type: 'image/jpeg' },
        { src: poster, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  } catch (e) {
    console.warn('⚠️ MediaSession error:', e);
  }
}

if ('mediaSession' in navigator) {
  video.addEventListener('play', actualizarMediaSession);

  const favImg = document.getElementById('favoritoImagen');
  if (favImg) {
    favImg.addEventListener('load', actualizarMediaSession);
  }
}



// Ajustar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  const savedTime = parseFloat(localStorage.getItem(`progress_${movieId}`) || 0);
  const totalDuration = parseFloat(localStorage.getItem(`duration_${movieId}`) || 1);
  const percentPlayed = savedTime / totalDuration;
  const hasStartedFlag = localStorage.getItem(`hasStarted_${movieId}`);

  // Solo mostrar el botón si ya empezó pero NO terminó
  if (percentPlayed < 0.8 && savedTime > 0 && hasStartedFlag === 'true') {
    showRestartButton();
  } else {
    hideRestartButton();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const header = document.getElementById('header');
  const pageTitle = document.getElementById('page-title');

  if (!header || !pageTitle) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const maxScroll = 300;

    const opacity = Math.min(scrollY / maxScroll, 1);
    const titleOpacity = scrollY > 150 ? Math.min(scrollY / maxScroll, 1) : 0;

    // Usamos #01011d con transparencia
    header.style.backgroundColor = `rgba(1, 1, 29, ${opacity})`;
    pageTitle.style.opacity = titleOpacity;
  });
});


const favoritoBtn = document.getElementById('favoritoBtn');
const favoritoIcon = document.getElementById('favoritoIcon'); // Ícono
const identificador = favoritoBtn.getAttribute('data-identificador');

// Función para manejar el favorito
async function toggleFavorito() {
  const favoritoEnlace = document.getElementById('favoritoEnlace');
  const imagen = document.getElementById('favoritoImagen');
  const nombre = document.getElementById('nombre').textContent;
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

  const encontrado = favoritos.some(f => f.identificador === identificador);

  if (encontrado) {
    const nuevos = favoritos.filter(f => f.identificador !== identificador);
    localStorage.setItem('favoritos', JSON.stringify(nuevos));
    favoritoIcon.innerText = 'add';
    mostrarNotificacion('Se eliminó de favoritos');
  } else {
    favoritos.push({
      identificador,
      imagen: imagen.outerHTML,
      enlace: favoritoEnlace.href,
      nombre
    });
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    favoritoIcon.innerText = 'check';
    mostrarNotificacion('Se añadió a favoritos');
  }

  // ⏫ Sincronizar con Supabase directamente
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    if (!encontrado) {
      await window.supabase.from('favoritos').upsert({
        id: userId,
        identificador,
        nombre,
        imagen: imagen.outerHTML,
        enlace: favoritoEnlace.href
      }, { onConflict: ['id', 'identificador'] });
    } else {
      await window.supabase.from('favoritos')
        .delete()
        .eq('id', userId)
        .eq('identificador', identificador);
    }
  } catch (e) {
    console.warn('❌ Error al sincronizar favorito:', e);
  }

  // 🔄 Subir el cambio a Supabase también por si hay más datos
  if (typeof throttledSyncData === 'function') {
    throttledSyncData(movieId);
  }
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

// Mostrar loader mientras se carga o busca
video.addEventListener('waiting', () => {
  loader.classList.remove('hidden');
});

// Ocultar loader cuando comience a reproducirse
video.addEventListener('playing', () => {
  loader.classList.add('hidden');
});

// También al cambiar manualmente de episodio o al adelantar
video.addEventListener('seeking', () => {
  loader.classList.remove('hidden');
});

video.addEventListener('seeked', () => {
  loader.classList.add('hidden');
});

// Bloquear teclas comunes de desarrollo
document.addEventListener('keydown', function(e) {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key === 'U')
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
});

function castCurrentVideo() {
  const video = document.getElementById("video");

  // ✅ Obtener instancia de Video.js
  const player = video?.player || videojs.getPlayer ? videojs.getPlayer("video") : null;

  if (!player) {
    alert("No se encontró el reproductor.");
    return;
  }

  const currentSrc = player.currentSrc();

  if (!currentSrc) {
    alert("No se encontró el enlace del video.");
    return;
  }

  const appLink = "wvc-x-callback://open?url=" + encodeURIComponent(currentSrc);
  const storeLink = "https://play.google.com/store/apps/details?id=com.instantbits.cast.webvideo";

  const transmitLink = document.createElement('a');
  transmitLink.href = appLink;
  transmitLink.style.display = 'none';
  document.body.appendChild(transmitLink);

  let appOpened = false;
  transmitLink.click();

  setTimeout(() => {
    if (!appOpened) {
      window.location.href = storeLink;
    }
    document.body.removeChild(transmitLink);
  }, 1000);

  window.addEventListener("blur", () => {
    appOpened = true;
  }, { once: true });
}


const mainTitle = document.querySelector(".title").textContent.trim();
const subTitle = document.getElementById("episodeSubtitle").textContent.trim();
const moviePoster = document.getElementById("favoritoImagen").src;
const movieLink = document.getElementById("favoritoEnlace").href;

// Guarda automáticamente al actualizar el tiempo
video.addEventListener("timeupdate", () => {
    const currentTime = video.currentTime;
    const duration = video.duration || 1;

    // Guarda datos individuales (para posibles usos futuros)
    localStorage.setItem(`progress_${movieId}`, currentTime);
    localStorage.setItem(`duration_${movieId}`, duration);

    // Guarda el objeto completo para la sección "Continuar Viendo"
    const movieData = {
        title: mainTitle || 'Sin título',
        subtitle: subTitle || '',
        poster: moviePoster || '',
        link: movieLink || '',
        progress: currentTime,
        duration: duration
    };

    localStorage.setItem(`movie_${movieId}`, JSON.stringify(movieData));
});




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

// Botón Backspace / Back
window.addEventListener('keydown', function(e) {
  if(e.key === 'Backspace' || e.key === 'BrowserBack') {
    history.back();
    e.preventDefault();
  }
});