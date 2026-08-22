// Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
  if (event.touches.length > 1) {
      event.preventDefault();
  }
}, { passive: false });

window.addEventListener('load', function () {
const overlay = document.querySelector('.overlay-loader-page');
const loader = document.getElementById('loader');

// Se mantiene el loader visible por 1 segundo
setTimeout(() => {
loader.style.opacity = '0'; // Corrige esto: '2' no tiene efecto visual
setTimeout(() => {
loader.style.display = 'none';
overlay.classList.add('hidden');
}, 300);
}, 1000);
});

// 🛡️ Respaldo por si 'load' nunca se dispara
setTimeout(() => {
const overlay = document.querySelector('.overlay-loader-page');
const loader = document.getElementById('loader');

if (loader && overlay && !overlay.classList.contains('hidden')) {
loader.style.display = 'none';
overlay.classList.add('hidden');
console.warn("Loader forzado a ocultarse después de 8 segundos.");
}
}, 8000);

console.log("🚀 player-series.js cargado");
const video = videojs('video'); // Video.js instance
video.off();
const videoElement = video.el().getElementsByTagName('video')[0];
const controls = document.getElementById('controls');
const overlay = document.getElementById('overlay');
const player = document.getElementById('player');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn').querySelector('.material-icons');
const cover = document.getElementById('cover');
let hideControlsTimeout;



// ✅ 👇 Aquí mismo agrega este
video.on('timeupdate', () => {

  console.log("video.currentTime:", video.currentTime);
  console.log("video.currentTime():", video.currentTime?.());

  const currentTime = video.currentTime();
const videoUrl = video.currentSrc();
const seriesId = window.seriesId;

if (!videoUrl || !seriesId) return;

const key = `progress-${seriesId}`;
const episodios = JSON.parse(localStorage.getItem(key) || '{}');
episodios[videoUrl] = {
  progress: currentTime,
  updated_at: Date.now()
};  
localStorage.setItem(key, JSON.stringify(episodios));

const resumeItem = JSON.parse(localStorage.getItem(`continue_${seriesId}`) || '{}');
if (resumeItem?.videoUrl === videoUrl) {
  resumeItem.progress = currentTime;
  localStorage.setItem(`continue_${seriesId}`, JSON.stringify(resumeItem));
}

if (window.throttledSyncData) {
    window.throttledSyncData(seriesId);
}
});



function togglePlay() {
if (video.paused()) {
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
video.currentTime(video.currentTime() + seconds);
}
window.pipPlay = function () {
  video.play();
};

window.pipPause = function () {
  video.pause();
};

window.pipForward = function () {
  skip(10);
};

window.pipRewind = function () {
  skip(-10);
};

function goBack() {

  document.body.classList.remove('video-active');

  player.style.display = 'none';
  cover.style.display = 'flex';

  // 🔥 Detener la notificación
  if (window.AndroidMedia) {
    AndroidMedia.stopNotification();
  }

  video.pause();
  playPauseBtn.textContent = 'play_arrow';

  if (window.Android) {
    Android.setPortrait();
  }
}

function restartVideo() {
video.currentTime(0);
video.play();
playPauseBtn.textContent = 'pause';
}



function updateProgress() {
if (video.duration()) {
  const remaining = video.duration() - video.currentTime();
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60).toString().padStart(2, '0');
  duration.textContent = `- ${mins}:${secs}`;

  const percent = (video.currentTime() / video.duration()) * 100;

  // mover el thumb y actualizar el fondo
  progress.value = percent;
  progress.style.background = `linear-gradient(to right, white ${percent}%, #666 ${percent}%)`;
}
}

// cuando el usuario arrastra el thumb
progress.addEventListener('input', () => {
const newTime = (progress.value / 100) * video.duration();
video.currentTime(newTime);

// esto hace que el thumb se mueva mientras arrastras
updateProgress();
});




const overlayTop = document.getElementById('overlayTop');
const overlayBottom = document.getElementById('overlayBottom');

let controlsVisible = false;


function showControls() {
controls.classList.add('visible');
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
controls.classList.remove('visible');
overlay.classList.remove('visible');
overlayTop.classList.remove('visible');
overlayBottom.classList.remove('visible');
controlsVisible = false;
}





function showPlayer() {
  document.body.classList.add('video-active'); // 🔥 CLAVE

  cover.style.display = 'none';
  player.style.display = 'flex';

  video.play();
  playPauseBtn.textContent = 'pause';
  showControls();

  if (window.Android) {
    Android.setLandscape();
  }
}

video.on('timeupdate', updateProgress);
video.on('loadedmetadata', updateProgress);

video.on('play', () => {

  lockOrientationLandscape();

  const playerContainer =
      document.getElementById('player');

  if (playerContainer?.requestFullscreen) {

      playerContainer
          .requestFullscreen()
          .catch(console.warn);
  }

});

video.on('play', () => {

  if (window.AndroidMedia) {
    AndroidMedia.setPlaying(true);
  }

});

video.on('pause', () => {

  if (window.AndroidMedia) {
    AndroidMedia.setPlaying(false);
  }

});

player.addEventListener('mousemove', showControls);

// 🎬 Tocar una zona vacía alterna los controles.
// Los botones y elementos interactivos NO cuentan como segundo toque.
function handlePlayerInteraction(e) {

  const interactiveElement = e.target.closest(
    'button, .btn, .icon-btn, .lang-menu, .lang-option, #langConfirmBtn, ' +
    '#progress, .progress-container, .episode-actions, ' +
    '[onclick], input, select'
  );

  if (interactiveElement) {
    return;
  }

  toggleControls();
}

player.addEventListener('click', handlePlayerInteraction);
player.addEventListener('touchstart', handlePlayerInteraction);

function toggleControls() {
  if (controlsVisible) {
    // Si ya están visibles, los ocultamos de inmediato
    hideControls();
    clearTimeout(hideControlsTimeout);
  } else {
    // Si están ocultos, los mostramos y activamos el timeout
    showControls();
  }
}

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
if (!video.paused()) {
video.pause();
}

playPauseBtn.textContent = 'play_arrow';
player.style.display = 'none';
cover.style.display = 'flex';

// 💡 GUARDAR PROGRESO ACTUAL
const videoUrl = video.currentSrc();
const currentTime = video.currentTime();

saveProgress(
    video,
    videoUrl,
    currentTime,
    seriesId
); // Esto ya actualiza localStorage y llama a updateResumeButton()

// 💥 OPCIONAL: Si también tenés miniaturas con barras de progreso
if (typeof updateThumbnailsProgress === 'function') {
updateThumbnailsProgress(); // Esta sería una función que recorres tus thumbnails y actualizás barras
}
}
});


// --- PESTAÑAS ---
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  seriesId = params.get('id');
  if (!seriesId) return;

  const remoteData = await loadMostRecentProgress(seriesId);

  let finalResume = JSON.parse(localStorage.getItem(`continue_${seriesId}`));

if (remoteData?.ultimo_visto) {
  const localData = JSON.parse(localStorage.getItem(`continue_${seriesId}`));

  const remoteTime = new Date(remoteData.updated_at || 0).getTime();
  const localTime = new Date(localData?.updatedAt || 0).getTime();

  if (!localData || remoteTime > localTime) {
    finalResume = remoteData.ultimo_visto;

    localStorage.setItem(
      `continue_${seriesId}`,
      JSON.stringify(remoteData.ultimo_visto)
    );
  }
}


  populateSeasons();

  renderEpisodes();

  // ▶️ Cargar episodio pendiente
  const resumeData = finalResume;
  if (resumeData && resumeData.videoUrl) {
    playEpisode(resumeData.videoUrl);
  }

  // Cuando el usuario cambie de temporada, actualizamos los episodios
  document.getElementById("seasonSelect").addEventListener('change', () => {
    // Guardar la selección
    localStorage.setItem(`selected-season-${seriesId}`, document.getElementById("seasonSelect").value);
    renderEpisodes();
  });
}

// Llamar init cuando cargue la página
window.addEventListener('DOMContentLoaded', init);



// --- TEMPORADAS ---
function populateSeasons() {
  const seasonSelect = document.getElementById("seasonSelect");
  seasonSelect.innerHTML = "";

  const savedIndex = parseInt(localStorage.getItem(`selected-season-${seriesId}`)) || 0;

  playlist.forEach((seasonObj, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = seasonObj.season;
    if (index === savedIndex) {
      option.selected = true;
    }
    seasonSelect.appendChild(option);
  });
}





async function renderEpisodes() {
  const seasonIndex = document.getElementById("seasonSelect").value;
  const episodesContainer = document.getElementById("episodeList");
  const season = playlist[seasonIndex];

  episodesContainer.innerHTML = "";


  const progressKey = `progress-${seriesId}`;
  const progressData = JSON.parse(localStorage.getItem(progressKey)) || {};

  const episodeHTMLs = season.episodes.map(ep => {
      const progress = progressData[ep.videoUrl];
      const isComplete = progress === -1;
      const newBadge = ep.isNew
  ? `<div class="new-badge">NUEVO</div>`
  : "";
    
      // ✅ Extrae duración desde ep.meta dentro del map
      const durationMinutes = parseFloat(ep.meta?.match(/(\d+)m/)?.[1]) || 47;
      const durationSeconds = durationMinutes * 60;
      const safeProgress = isComplete ? durationSeconds : (progress || 0);
      const percent = Math.min((safeProgress / durationSeconds) * 100, 100);
    
      const showProgress = progress !== undefined;

    return `
  <div class="episode" data-url="${ep.videoUrl}" onclick="playEpisode('${ep.videoUrl}')" tabindex="0">
  <div class="thumbnail-container">
   <div class="episode-play-icon">
    <span class="material-icons">play_arrow</span>
</div>
  ${newBadge}

  <img src="${ep.thumbnail}" alt="${ep.title}"
       oncontextmenu="return false"
       ondragstart="return false"
       onmousedown="return false"
       ontouchstart="event.preventDefault()">

  ${showProgress ? `
    <div class="progress-track">
      <div class="progress-bar" style="width: ${percent}%;"></div>
    </div>
  ` : ''}
</div>
  <div class="episode-details">
    <div class="episode-title">${ep.title}</div>
    <div class="episode-meta">${ep.meta}</div>
  </div>
  <div class="episode-actions">
    <div class="episode-download"
onclick="event.stopPropagation(); descargarEpisodio('${ep.downloadUrl}', '${ep.title}', '${ep.thumbnail}')"
tabindex="0">
  <div class="material-icons download-icon">arrow_downward</div>
  <div class="download-line"></div>
</div>
  </div>
</div>
`;

  });

  episodesContainer.innerHTML = episodeHTMLs.join('');
  updateResumeButton();
}

// =========================================================
// NAVEGACIÓN AUTOMÁTICA DE EPISODIOS
// =========================================================

function inicializarNavegacionEpisodios() {

    const episodeList = document.getElementById("episodeList");

    if (!episodeList) return;

    // Evitar crear las flechas más de una vez
    if (episodeList.parentElement?.classList.contains("episodes-carousel")) {
        actualizarFlechasEpisodios();
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "episodes-carousel";

    const left = document.createElement("button");
    left.className = "episode-nav episode-nav-left";
    left.innerHTML = `<span class="material-icons">chevron_left</span>`;

    const right = document.createElement("button");
    right.className = "episode-nav episode-nav-right";
    right.innerHTML = `<span class="material-icons">chevron_right</span>`;

    episodeList.parentNode.insertBefore(wrapper, episodeList);

    wrapper.appendChild(left);
    wrapper.appendChild(episodeList);
    wrapper.appendChild(right);

    left.addEventListener("click", () => {
        episodeList.scrollBy({
            left: -500,
            behavior: "smooth"
        });
    });

    right.addEventListener("click", () => {
        episodeList.scrollBy({
            left: 500,
            behavior: "smooth"
        });
    });

    episodeList.addEventListener(
        "scroll",
        actualizarFlechasEpisodios
    );

    window.addEventListener(
        "resize",
        actualizarFlechasEpisodios
    );

    actualizarFlechasEpisodios();
}


function actualizarFlechasEpisodios() {

    const episodeList = document.getElementById("episodeList");

    if (!episodeList) return;

    const wrapper = episodeList.parentElement;

    if (!wrapper.classList.contains("episodes-carousel")) return;

    const left = wrapper.querySelector(".episode-nav-left");
    const right = wrapper.querySelector(".episode-nav-right");

    if (!left || !right) return;

    const puedeDesplazar =
        episodeList.scrollWidth >
        episodeList.clientWidth + 5;

    left.classList.toggle(
        "hidden",
        !puedeDesplazar ||
        episodeList.scrollLeft <= 5
    );

    right.classList.toggle(
        "hidden",
        !puedeDesplazar ||
        episodeList.scrollLeft + episodeList.clientWidth >=
        episodeList.scrollWidth - 5
    );
}


function descargarEpisodio(url, title, img) {

  const serieNombre = window.seriesName || "Serie";

  // 🔥 ahora sí mandamos tipo correcto
  const data = serieNombre + "|" + title + "|" + img + "|series";

  if (typeof Android !== "undefined") {
    Android.downloadFile(url, data);
  } else {
    window.open(url, "_blank");
  }
}

// --- MENÚ DESLIZANTE DE TEMPORADAS ---
function fillSeasonMenu() {
  const seasonOptionsContainer = document.getElementById("seasonOptions");
  seasonOptionsContainer.innerHTML = "";
  const currentSeason = parseInt(document.getElementById("seasonSelect").value);
  playlist.forEach((season, index) => {
    const option = document.createElement("div");
    option.classList.add("season-option");
    if (index === currentSeason) option.classList.add("selected");
    option.textContent = season.season;
    option.onclick = () => {
  document.getElementById("seasonSelect").value = index;
  localStorage.setItem(`selected-season-${seriesId}`, index); // ✅ Guardar selección
  renderEpisodes();
  closeSeasonMenu();
};
    seasonOptionsContainer.appendChild(option);
  });
}



// --- BLOQUEAR/DESBLOQUEAR SCROLL ---
let scrollPosition = 0;

function disableBodyScroll() {
scrollPosition = window.scrollY; // guarda la posición actual
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollPosition}px`;
document.body.style.width = '100%';
}

function enableBodyScroll() {
document.body.style.position = '';
document.body.style.top = '';
document.body.style.width = '';
window.scrollTo(0, scrollPosition); // vuelve a la posición original
}



// --- ABRIR Y CERRAR MENÚ CON CONTROL DE SCROLL ---
function openSeasonMenu() {
  document.getElementById("menuOverlay").classList.remove("hidden");
  document.getElementById("seasonMenu").classList.remove("hidden");
  requestAnimationFrame(() => {
    document.getElementById("seasonMenu").classList.add("show");
  });
  disableBodyScroll();
}

function closeSeasonMenu() {
  document.getElementById("menuOverlay").classList.add("hidden");
  const menu = document.getElementById("seasonMenu");
  menu.classList.remove("show");
  setTimeout(() => {
    menu.classList.add("hidden");
    enableBodyScroll();
  }, 300);
}

const seasonOverlay  = document.getElementById("menuOverlay");
const seasonMenu     = document.getElementById("seasonMenu");
const dragIndicator  = document.querySelector(".menu-drag-indicator");

// --- CERRAR AL HACER CLICK EN OVERLAY ---
seasonOverlay.addEventListener("click", closeSeasonMenu);

// --- GESTO DE ARRASTRE SOLO DESDE EL INDICADOR ---
let startY = 0;
let isDragging = false;

function onStart(e) {
  isDragging = true;
  startY = e.touches ? e.touches[0].clientY : e.clientY;

  // Escuchar en todo el documento mientras dure el drag
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
  document.addEventListener("touchmove", onMove);
  document.addEventListener("touchend", onEnd);
}

function onMove(e) {
  if (!isDragging) return;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  const deltaY = currentY - startY;

  // Solo cerrar si arrastra bastante hacia abajo
  if (deltaY > 30) {
    closeSeasonMenu();
    onEnd(); // limpiar listeners
  }
}

function onEnd() {
  isDragging = false;
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onEnd);
  document.removeEventListener("touchmove", onMove);
  document.removeEventListener("touchend", onEnd);
}

// Eventos SOLO en el drag-indicator
dragIndicator.addEventListener("mousedown", onStart);
dragIndicator.addEventListener("touchstart", onStart);



// --- DESACTIVAR MENÚ NATIVO Y USAR MENÚ PERSONALIZADO ---
document.getElementById("seasonSelect").addEventListener("mousedown", e => e.preventDefault());
document.getElementById("seasonSelect").addEventListener("click", () => {
  fillSeasonMenu();
  openSeasonMenu();
});

// Inicializar
populateSeasons();
renderEpisodes().then(() => {
    inicializarNavegacionEpisodios();
});




// Guardar y cargar progreso
async function saveProgress(video, videoUrl, currentTime, seriesId) {
  const key = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(key)) || {};
  data[videoUrl] = currentTime;
  localStorage.setItem(key, JSON.stringify(data));

  const duration = video.duration() || 1;
  const progressKey = `progress_${seriesId}_${videoUrl}`;
  const durationKey = `duration_${seriesId}_${videoUrl}`;
  const episodeData = findEpisodeData(videoUrl);
  if (!episodeData) return;

  const { episodeCode, thumbnail } = episodeData;
  const seriesTitle = document.getElementById('page-title')?.textContent || 'Serie';
  const seriesLink = document.getElementById('favoritoEnlace')?.href || window.location.href;

  localStorage.setItem(progressKey, currentTime || 0);
  localStorage.setItem(durationKey, duration);

  const indexes = findEpisodeIndexes(videoUrl);

  localStorage.setItem(`continue_${seriesId}`, JSON.stringify({
    seriesId,
    seriesTitle,
    episodeTitle: episodeCode,
    poster: thumbnail,
    link: seriesLink,
    progress: currentTime || 0,
    duration,
    videoUrl,
    season_index: indexes?.seasonIndex ?? 0,
    episode_index: indexes?.episodeIndex ?? 0,
     updatedAt: Date.now()
  }));

  
/*
  // 📌 Registrar vista en user_views
  try {
    if (duration > 0 && currentTime / duration >= 0.8) {
      await onPlayEpisode(session.user.id, seriesId, episodeCode, Math.floor(currentTime));
      console.log('✅ Vista registrada en user_views para episodio:', episodeCode);
    }
  } catch (err) {
    console.error('❌ Error registrando vista en user_views:', err);
  }
*/

console.log("🚀 Enviando progreso a saveSeriesProgress()", {
  seriesId,
  videoUrl,
  currentTime,
  duration
});
  // ✅ Sincronizar con tabla progresos
  try {
  await saveSeriesProgress({
  id: seriesId,
  series_id: seriesId,
  video_url: videoUrl,
  episodio: episodeCode,

  progreso: currentTime || 0,
  duration,

  poster: thumbnail,
  link: seriesLink,

  season_index: indexes?.seasonIndex ?? 0,
  episode_index: indexes?.episodeIndex ?? 0,

  visto_en: new Date().toISOString()
});

  console.log("✅ Progreso enviado mediante saveSeriesProgress()");
} catch (error) {
  console.error("❌ Error sincronizando:", error);
}

  localStorage.setItem('justReturnedFromSeries', 'true');
  updateResumeButton();
}





// Helper para buscar datos del episodio
function findEpisodeData(videoUrl) {

  for (let season of playlist) {

    const episode = season.episodes.find(ep =>
      ep.videoUrl === videoUrl ||
      Object.values(ep.videos || {}).includes(videoUrl)
    );

    if (episode) {

      return {
        episodeCode: episode.episodeCode,
        thumbnail: episode.thumbnail
      };

    }
  }

  return null;
}


// Helper para encontrar los índices de temporada y episodio
function findEpisodeIndexes(videoUrl) {

  for (
    let seasonIndex = 0;
    seasonIndex < playlist.length;
    seasonIndex++
  ) {

    const season = playlist[seasonIndex];

    for (
      let episodeIndex = 0;
      episodeIndex < season.episodes.length;
      episodeIndex++
    ) {

      const episode =
        season.episodes[episodeIndex];

      const isCurrentEpisode =
        episode.videoUrl === videoUrl ||
        Object.values(episode.videos || {})
          .includes(videoUrl);

      if (isCurrentEpisode) {

        return {
          seasonIndex,
          episodeIndex
        };

      }
    }
  }

  return null;
}



function loadProgress(videoUrl) {

  const key = `progress-${seriesId}`;
  const data = JSON.parse(
    localStorage.getItem(key) || '{}'
  );

  const value = data[videoUrl];

  if (value === -1) {
    return 0;
  }

  if (typeof value === 'object' && value !== null) {
    return Number(value.progress) || 0;
  }

  return Number(value) || 0;
}


// Buscar siguiente episodio
function findNextEpisode(currentUrl) {

  const preferred =
    localStorage.getItem('preferredLang') || 'latino';

  for (
    let seasonIndex = 0;
    seasonIndex < playlist.length;
    seasonIndex++
  ) {

    const season = playlist[seasonIndex];

    for (
      let i = 0;
      i < season.episodes.length;
      i++
    ) {

      const episode = season.episodes[i];

      // 🔥 Comprobar TODAS las versiones del episodio
      const isCurrentEpisode =
        episode.videoUrl === currentUrl ||
        Object.values(episode.videos || {})
          .includes(currentUrl);

      if (!isCurrentEpisode) continue;


      // ▶️ Siguiente episodio de la misma temporada
      if (season.episodes[i + 1]) {

        const nextEpisode =
          season.episodes[i + 1];

        return (
          nextEpisode.videos?.[preferred] ||
          nextEpisode.videos?.latino ||
          nextEpisode.videos?.sub ||
          nextEpisode.videoUrl
        );
      }


      // ▶️ Primera episodio de la siguiente temporada
      if (
        playlist[seasonIndex + 1] &&
        playlist[seasonIndex + 1].episodes.length > 0
      ) {

        const nextEpisode =
          playlist[seasonIndex + 1].episodes[0];

        return (
          nextEpisode.videos?.[preferred] ||
          nextEpisode.videos?.latino ||
          nextEpisode.videos?.sub ||
          nextEpisode.videoUrl
        );
      }

    }
  }

  return null;
}
// Función para bloquear la orientación en landscape
function lockOrientationLandscape() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch((err) => {
      console.warn('No se pudo bloquear la orientación:', err);
    });
  }
}





// ▶ Reproducir episodio
function playEpisode(videoUrl) {

window.episodeId = videoUrl;

// 🔒 Guardar el EPISODIO, no la URL del idioma
const indexes = findEpisodeIndexes(videoUrl);

if (indexes) {
  localStorage.setItem(`last-episode-${seriesId}`, JSON.stringify({
    seasonIndex: indexes.seasonIndex,
    episodeIndex: indexes.episodeIndex
  }));
}

video.src({
    type: 'video/mp4',
    src: videoUrl
  });

  // 🔥 Mostrar reproductor inmediatamente
  showPlayer();

  // 🔥 Crear notificación inmediatamente
  if (window.AndroidMedia) {
    AndroidMedia.setPlaying(true);
  }

  const progress = loadProgress(videoUrl);

  function setTimeOnce() {

    video.off("loadedmetadata", setTimeOnce);

    const isFinished =
      progress >= video.duration() - 5;

    video.currentTime(
      isFinished ? 0 : progress
    );

    updateResumeButton();

    // 🔥 Enviar nombre, temporada, episodio e imagen
    updateEpisodeUI(videoUrl);
  }

  video.on("loadedmetadata", setTimeOnce);

window.dispatchEvent(
    new CustomEvent('playEpisode', {
        detail: findEpisodeByUrl(videoUrl)
    })
);
}


// ▶ Actualizar información del episodio
function updateEpisodeUI(videoUrl) {

  let found = false;

  for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {

    const season = playlist[seasonIndex];

    const episode = season.episodes.find(
  ep =>
    ep.videoUrl === videoUrl ||
    Object.values(ep.videos || {}).includes(videoUrl)
);

    if (episode) {

      document.getElementById("episodeSubtitle").textContent =
        episode.episodeCode;

      const serie =
        document.getElementById("nombre").textContent.trim();

      const temporada =
        season.season;

      const episodio =
        episode.episodeCode;

      const imagen =
        episode.thumbnail;

        if (window.AndroidMedia) {

          alert(
              "Serie: " + serie +
              "\nTemporada: " + temporada +
              "\nEpisodio: " + episodio
          );
      
          AndroidMedia.updateMediaInfo(
              serie,
              temporada,
              episodio,
              imagen
          );
      
      }

      // Seleccionar temporada actual
      document.getElementById("seasonSelect").value =
        seasonIndex;

      localStorage.setItem(
        `selected-season-${seriesId}`,
        seasonIndex
      );

      renderEpisodes();
      fillSeasonMenu();

      // Resaltar episodio actual
      setTimeout(() => {

        const currentEpEl =
          document.querySelector(
            `.episode[data-url="${videoUrl}"]`
          );

        if (currentEpEl) {
          currentEpEl.classList.add("active");
        }

      }, 100);

      // Intro
      if (episode.intro) {

        skipIntroStart =
          episode.intro.start;

        skipIntroEnd =
          episode.intro.end;

        document
          .getElementById('skipIntroBtn')
          .classList.remove('hidden');

      } else {

        skipIntroStart = null;
        skipIntroEnd = null;

        document
          .getElementById('skipIntroBtn')
          .classList.add('hidden');
      }

      updateResumeButton();
      updateNextEpisodeLabel?.();

      found = true;
      break;
    }
  }

  if (!found) {
    console.warn(
      "No se encontró el episodio en el playlist."
    );
  }
}


// Mostrar/ocultar el botón durante el tiempo del intro
// Variables de control
let skipIntroTimeoutId = null;
let lastIntroState = false;

// Evento para mostrar/ocultar el botón durante el intro
video.on('timeupdate', () => {
  const btn = document.getElementById('skipIntroBtn');

  // Validación estricta para evitar parpadeos o mostrar cuando no debe
  if (
    typeof skipIntroStart !== 'number' ||
    typeof skipIntroEnd !== 'number' ||
    skipIntroStart <= 0 ||
    skipIntroEnd <= 0 ||
    skipIntroEnd <= skipIntroStart ||
    video.readyState < 1 // El video no ha cargado contenido aún
  ) {
    btn.classList.add('hidden');
    clearTimeout(skipIntroTimeoutId);
    lastIntroState = false;
    return;
  }

  const inIntroWindow = video.currentTime() >= skipIntroStart && video.currentTime() < skipIntroEnd;

  if (inIntroWindow) {
    if (!lastIntroState) {
      btn.classList.remove('hidden');

      clearTimeout(skipIntroTimeoutId);
      skipIntroTimeoutId = setTimeout(() => {
        btn.classList.add('hidden');
      }, 20000); // Ocultar tras 20 segundos si no se presiona
    }

    lastIntroState = true;
  } else {
    btn.classList.add('hidden');
    clearTimeout(skipIntroTimeoutId);
    lastIntroState = false;
  }
});

// Ocultar botón al comenzar a cargar nuevo video (evita parpadeos)
video.on('loadstart', () => {
  const btn = document.getElementById('skipIntroBtn');
  btn.classList.add('hidden');
  clearTimeout(skipIntroTimeoutId);
  lastIntroState = false;
});

// Acción del botón para saltar intro
function skipIntro() {
  if (typeof skipIntroEnd === 'number' && skipIntroEnd > 0) {
    video.currentTime(skipIntroEnd);
    document.getElementById('skipIntroBtn').classList.add('hidden');
  }
}


// Al terminar el video, guarda el progreso y pasa al siguiente episodio
video.on('ended', () => {
  const currentSrc = video.currentSrc();
  const progressKey = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(progressKey)) || {};
  data[currentSrc] = -1;
  localStorage.setItem(progressKey, JSON.stringify(data));

  const nextUrl = findNextEpisode(currentSrc);

  if (nextUrl) {
    // 🟢 Cargar el siguiente episodio
    playEpisode(nextUrl);

    // ⚠️ Esperar a que cargue para guardar el progreso correctamente
    video.one('loadedmetadata', async () => {
      const episodeData = findEpisodeData(nextUrl);
      if (!episodeData) return;

      const duration = video.duration() || 1;
      const seriesTitle = document.getElementById('page-title')?.textContent || 'Serie';
      const seriesLink = document.getElementById('favoritoEnlace')?.href || window.location.href;

      const indexes = findEpisodeIndexes(nextUrl); // ✅ para Supabase

      const continueData = {
        seriesId,
        seriesTitle,
        episodeTitle: episodeData.episodeCode,
        poster: episodeData.thumbnail,
        link: seriesLink,
        progress: 0,
        duration,
        videoUrl: nextUrl,
        season_index: indexes?.seasonIndex ?? 0,
        episode_index: indexes?.episodeIndex ?? 0
      };

      // Guardar local
      localStorage.setItem(`continue_${seriesId}`, JSON.stringify(continueData));
      localStorage.setItem('justReturnedFromSeries', 'true');
      updateResumeButton?.();

      // 🔄 Sincronizar Supabase
     try {
  await saveSeriesProgress({
    seriesId,
    ultimoVisto: continueData,
    episodios: {
      [nextUrl]: {
        progress: 0,
        duration,
        seriesTitle: item.series_title,
        episodeTitle: episodeData.episodeCode,
        poster: episodeData.thumbnail,
        season_index: indexes?.seasonIndex ?? 0,
        episode_index: indexes?.episodeIndex ?? 0,
        updatedAt: Date.now()
      }
    }
  });

  console.log("✅ Siguiente episodio sincronizado");
} catch (err) {
  console.error("❌ Error sincronizando:", err);
}
    });

  } else {

    // 🧹 No hay más episodios
    localStorage.removeItem(`continue_${seriesId}`);
  
    // 🔥 Eliminar notificación
    if (window.AndroidMedia) {
      AndroidMedia.stopNotification();
    }
  
    goBack();
  }
});





// Guarda el progreso periódicamente
video.on('timeupdate', () => {

  const videoElement = video.el().getElementsByTagName('video')[0];
  const episodeId = videoElement.getAttribute('data-episode-code') || video.currentSrc();

  const currentTime = video.currentTime();
  const duration = video.duration() || 1;
  const percent = Math.min((currentTime / duration) * 100, 100);

  saveProgress(video, video.currentSrc(), currentTime, seriesId);
  updateResumeButton();

  const episodeElement = document.querySelector(`.episode[data-url="${video.currentSrc()}"]`);
  if (!episodeElement) return;

  let bar = episodeElement.querySelector('.progress-bar');
  if (!bar) {
    const track = document.createElement('div');
    track.className = 'progress-track';
    bar = document.createElement('div');
    bar.className = 'progress-bar';
    track.appendChild(bar);
    episodeElement.querySelector('.thumbnail-container').appendChild(track);
  }

  bar.style.width = `${percent}%`;
});





function playLastWatchedEpisode() {
  const lastKey = `last-episode-${seriesId}`;
  const progressKey = `progress-${seriesId}`;
  const lastEpisodeData = JSON.parse(
  localStorage.getItem(lastKey) || 'null'
);
  const progressData = JSON.parse(localStorage.getItem(progressKey)) || {};

  if (lastEpisodeData) {

  const seasonIndex = lastEpisodeData.seasonIndex;
  const episodeIndex = lastEpisodeData.episodeIndex;

  const episode =
    playlist[seasonIndex]?.episodes[episodeIndex];

  if (!episode) {
    console.warn("No se encontró el último episodio guardado.");
    return;
  }

  const preferred =
    localStorage.getItem('preferredLang') || 'latino';

  const lastUrl =
    episode.videos?.[preferred] ||
    episode.videoUrl;

  const lastTimeData =
    progressData[lastUrl];

  const lastTime =
    typeof lastTimeData === 'object'
      ? (lastTimeData.progress || 0)
      : (lastTimeData || 0);

  const safeTime = lastTime < 5 ? 0 : lastTime;

    video.src({ type: 'video/mp4', src: lastUrl });

    video.ready(function () {
      video.currentTime(safeTime);

      // ✅ Pantalla completa
      const playerContainer = document.getElementById('player');
      if (playerContainer?.requestFullscreen) {
        playerContainer.requestFullscreen().catch(console.warn);
      }

      // 🔒 Orientación horizontal
      lockOrientationLandscape();
    });

    showPlayer();

    for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
      const season = playlist[seasonIndex];
      const episode = season.episodes.find(ep => ep.videoUrl === lastUrl);
      if (episode) {
        document.getElementById("seasonSelect").value = seasonIndex;
        document.getElementById("episodeSubtitle").textContent = episode.episodeCode;

        if (episode.intro) {
          skipIntroStart = episode.intro.start;
          skipIntroEnd = episode.intro.end;
          document.getElementById('skipIntroBtn').classList.remove('hidden');
        } else {
          skipIntroStart = skipIntroEnd = null;
          document.getElementById('skipIntroBtn').classList.add('hidden');
        }

        break;
      }
    }

    return;
  }

  // No hay último guardado: reproducir el primero
  const firstUrl = playlist[0].episodes[0].videoUrl;
  video.src({ type: 'video/mp4', src: firstUrl });
  localStorage.setItem(`last-episode-${seriesId}`, firstUrl);

  video.ready(function () {
    video.currentTime(0);

    // ✅ Pantalla completa
    const playerContainer = document.getElementById('player');
    if (playerContainer?.requestFullscreen) {
      playerContainer.requestFullscreen().catch(console.warn);
    }

    // 🔒 Orientación horizontal
    lockOrientationLandscape();
  });

  showPlayer();

  document.getElementById("seasonSelect").value = 0;
  document.getElementById("episodeSubtitle").textContent = playlist[0].episodes[0].episodeCode;

  const episode = playlist[0].episodes[0];
  if (episode.intro) {
    skipIntroStart = episode.intro.start;
    skipIntroEnd = episode.intro.end;
    document.getElementById('skipIntroBtn').classList.remove('hidden');
  } else {
    skipIntroStart = skipIntroEnd = null;
    document.getElementById('skipIntroBtn').classList.add('hidden');
  }

  updateResumeButton();
}



function updateResumeButton() {
    const button = document.getElementById('resumeButton');
    if (!button) return;

    const key = `last-episode-${seriesId}`;
    const progressKey = `progress-${seriesId}`;

    const lastEpisodeData = JSON.parse(
        localStorage.getItem(key) || 'null'
    );

    const progressData = JSON.parse(
        localStorage.getItem(progressKey) || '{}'
    );

    let episode = null;
    let episodeUrl = null;

    // =====================================================
    // 🔥 NUEVO FORMATO: { seasonIndex, episodeIndex }
    // =====================================================
    if (
        lastEpisodeData &&
        typeof lastEpisodeData === 'object' &&
        Number.isInteger(lastEpisodeData.seasonIndex) &&
        Number.isInteger(lastEpisodeData.episodeIndex)
    ) {
        const season =
            playlist[lastEpisodeData.seasonIndex];

        episode =
            season?.episodes?.[lastEpisodeData.episodeIndex];

        if (episode) {
            const preferred =
                localStorage.getItem('preferredLang') || 'latino';

            episodeUrl =
                episode.videos?.[preferred] ||
                episode.videos?.latino ||
                episode.videos?.sub ||
                episode.videoUrl;
        }
    }

    // =====================================================
    // 🔙 COMPATIBILIDAD CON EL FORMATO ANTIGUO
    // =====================================================
    if (!episode && typeof lastEpisodeData === 'string') {

        episodeUrl = lastEpisodeData;

        for (const season of playlist) {
            const found = season.episodes.find(ep =>
                ep.videoUrl === episodeUrl ||
                Object.values(ep.videos || {}).includes(episodeUrl)
            );

            if (found) {
                episode = found;
                break;
            }
        }
    }

    // =====================================================
    // ▶️ SI ENCONTRAMOS EL EPISODIO
    // =====================================================
    if (episode) {

        const progressDataForEpisode =
            episodeUrl ? progressData[episodeUrl] : null;

        let lastTime = 0;

        if (
            typeof progressDataForEpisode === 'object' &&
            progressDataForEpisode !== null
        ) {
            lastTime =
                Number(progressDataForEpisode.progress) || 0;
        } else {
            lastTime =
                Number(progressDataForEpisode) || 0;
        }

        const isComplete = lastTime === -1;

        const label = isComplete
            ? 'Mira'
            : 'Continuar';

        const durationMinutes =
            parseFloat(
                episode.meta?.match(/(\d+)m/)?.[1]
            ) || 47;

        const durationSeconds =
            durationMinutes * 60;

        const percent =
            isComplete
                ? 100
                : Math.min(
                    (lastTime / durationSeconds) * 100,
                    100
                );

        button.innerHTML = `
            <div class="resume-text-wrapper">
                <span class="material-icons">play_arrow</span>

                <div class="text-with-bar">

                    <div class="resume-label">
                        ${label} ${episode.hiddenCode || episode.episodeCode}
                    </div>

                    ${
                        percent > 0
                        ? `
                        <div class="resume-progress-track">
                            <div
                                class="resume-progress-bar"
                                style="width: ${percent}%;">
                            </div>
                        </div>
                        `
                        : ''
                    }

                </div>
            </div>
        `;

        return;
    }

    // =====================================================
    // ▶️ NO HAY EPISODIO GUARDADO → PRIMER EPISODIO
    // =====================================================
    const first = playlist?.[0]?.episodes?.[0];

    if (!first) return;

    button.innerHTML = `
        <div class="resume-text-wrapper">
            <span class="material-icons">play_arrow</span>

            <div class="text-with-bar">
                <div class="resume-label">
                    Mira ${first.hiddenCode || first.episodeCode}
                </div>
            </div>
        </div>
    `;
}

updateResumeButton();





let nextEpisodeTimeout = null;
let circleAnimationInterval = null;
let circleProgress = 0;

function playNextEpisode() {
  // Marcar el episodio actual como completado
  const progressKey = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(progressKey)) || {};
  const currentUrl = video.currentSrc();
data[currentUrl] = -1;
  localStorage.setItem(progressKey, JSON.stringify(data));

  // Cambiar al siguiente episodio
  const nextUrl = findNextEpisode(currentUrl);
  if (nextUrl) playEpisode(nextUrl);
}


function updateNextEpisodeLabel() {
  const nextUrl = findNextEpisode(video.currentSrc());

  if (!nextUrl) return;
  for (const season of playlist) {
    for (const ep of season.episodes) {
      if (ep.videoUrl === nextUrl) {
        document.getElementById('nextEpisodeLabel').textContent = `Siguiente episodio ${ep.hiddenCode}`;
        return;
      }
    }
  }
}

// Mostrar botón 20s antes del final
video.on('timeupdate', () => {
  const remaining = video.duration() - video.currentTime();
  const nextBtn = document.getElementById('nextEpisodeBtn');
  const nextUrl = findNextEpisode(video.currentSrc());

  if (remaining <= 20 && nextUrl) {
    if (nextBtn.classList.contains('hidden')) {
      nextBtn.classList.remove('hidden');
      updateNextEpisodeLabel();
      startCircleAnimation();
    }
  } else {
    nextBtn.classList.add('hidden');
    stopCircleAnimation();
  }
});


// Círculo de cuenta regresiva de 10s en bucle
function startCircleAnimation() {
  circleProgress = 0;
  const circle = document.getElementById('circleProgress');
  clearInterval(circleAnimationInterval);

  circleAnimationInterval = setInterval(() => {
    circleProgress += 1;
    if (circleProgress > 100) circleProgress = 0;
    circle.setAttribute('stroke-dasharray', `${circleProgress}, 100`);
  }, 100); // 100ms × 100 = 10s
}

function stopCircleAnimation() {
  clearInterval(circleAnimationInterval);
  document.getElementById('circleProgress').setAttribute('stroke-dasharray', '0, 100');
}

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
// ================================
// 👤 PERFIL – sincronizar imágenes
// ================================
function updateProfileImage(src) {
  if (!src) return;

  const ids = [
    "footerIconImg",
    "profileImage",
    "profilePageImage",
    "headerProfileIcon",
    "editableProfile",
    "editableProfileInModal"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tagName === "IMG") {
      el.src = src;
    }
  });

  // Ocultar iconos por defecto si existen
  const defaultIcon = document.getElementById("defaultProfileIcon");
  if (defaultIcon) defaultIcon.style.display = "none";

  const defaultIconAlt = document.getElementById("defaultProfileIconAlt");
  if (defaultIconAlt) defaultIconAlt.style.display = "none";

  // Guardar imagen
  localStorage.setItem("profileImage", src);
}

// Restaurar al cargar página
document.addEventListener("DOMContentLoaded", () => {
  const savedProfileImage = localStorage.getItem("profileImage");
  if (savedProfileImage) {
    updateProfileImage(savedProfileImage);
  }
});
// Función para cambiar todas las imágenes de perfil
function updateProfileImage(src) {
  const ids = [
    "footerIconImg",
    "footerProfileImage",
    "profileImage",
    "profilePageImage",
    "editableProfile",
    "editableProfileInModal",
    "headerProfileIcon"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = src;
  });

  // Ocultar iconos por defecto si existen
  const defaultIcon = document.getElementById("defaultProfileIcon");
  if (defaultIcon) defaultIcon.style.display = "none";

  const defaultIconAlt = document.getElementById("defaultProfileIconAlt");
  if (defaultIconAlt) defaultIconAlt.style.display = "none";

  // Guardar en localStorage
  localStorage.setItem("profileImage", src);
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener("load", () => {
  const storedProfileImage = localStorage.getItem("profileImage");
  if (storedProfileImage) {
    updateProfileImage(storedProfileImage); // Reutilizamos la función
  }
});


var lastScrollTop = 0;
    var footer = document.querySelector(".footer");

    window.addEventListener("scroll", function () {
        var currentScroll = window.scrollY;

        if (currentScroll > lastScrollTop) {
            // Desliza hacia abajo -> Ocultar footer
            footer.classList.add("hidden");
        } else {
            // Desliza hacia arriba -> Mostrar footer
            footer.classList.remove("hidden");
        }

        lastScrollTop = currentScroll;
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
    'https://wplyrhcszuoordgaphax.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU' // tu anon key completa
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

const aspectModes = ['cover', 'fill', 'contain', 'fit-height', 'fit-width', 'scale-down'];
let currentAspectIndex = 0;

function toggleAspectRatio() {
  currentAspectIndex = (currentAspectIndex + 1) % aspectModes.length;
  const mode = aspectModes[currentAspectIndex];

  // Asegura que usamos el elemento de video real
  const videoElement = video.el().getElementsByTagName('video')[0];
const episodeId =
  videoElement?.getAttribute('data-episode-code') ||
  video.currentSrc();

  // Aplica el modo
  videoElement.style.objectFit = mode.includes('fit-') ? 'contain' : mode;

  switch (mode) {
    case 'fit-height':
      videoElement.style.width = 'auto';
      videoElement.style.height = '100%';
      break;
    case 'fit-width':
      videoElement.style.width = '100%';
      videoElement.style.height = 'auto';
      break;
    default:
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      break;
  }

  const label = document.getElementById('aspectLabel');
  label.textContent = mode;
  label.style.display = 'block';

  clearTimeout(label._hideTimeout);
  label._hideTimeout = setTimeout(() => {
    label.style.display = 'none';
  }, 1500);
}


function castCurrentVideo() {
  const currentSrc = video.currentSrc(); // usa método

  let videoUrl = null;

  // Buscar el episodio actual en el playlist
  outerLoop:
  for (const season of playlist) {
    for (const episode of season.episodes) {
      if (episode.videoUrl === currentSrc) {
        videoUrl = episode.videoUrl;
        break outerLoop;
      }
    }
  }

  if (videoUrl) {
    const appLink = "wvc-x-callback://open?url=" + encodeURIComponent(videoUrl);
    const storeLink = "https://play.google.com/store/apps/details?id=com.instantbits.cast.webvideo";

    // Crear enlace temporal invisible
    const transmitLink = document.createElement('a');
    transmitLink.href = appLink;
    transmitLink.style.display = 'none';
    document.body.appendChild(transmitLink);

    let appOpened = false;
    transmitLink.click();

    // Si la app no se abre, redirige a la Play Store
    setTimeout(() => {
      if (!appOpened) {
        window.location.href = storeLink;
      }
      document.body.removeChild(transmitLink);
    }, 1000);

    // Si se pierde el foco, asumimos que se abrió la app
    window.addEventListener("blur", () => {
      appOpened = true;
    }, { once: true });

  } else {
    alert("No se pudo obtener el enlace del episodio actual.");
  }
}


const loader = document.getElementById('videoLoader');

// Mostrar loader mientras se carga o busca
video.on('waiting', () => {
  loader.classList.remove('hidden');
});

// Ocultar loader cuando comience a reproducirse
video.on('playing', () => {
  loader.classList.add('hidden');
});

// También al cambiar manualmente de episodio o al adelantar
video.on('seeking', () => {
  loader.classList.remove('hidden');
});

video.on('seeked', () => {
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


const coverImageOverlay = document.querySelector('.cover-image-overlay');
const landscapeImageOverlay = document.querySelector('.cover-landscape-image-overlay');

let lastScroll = window.scrollY;

function updateOverlayOpacity() {
  const currentScroll = window.scrollY;
  const scrollingUp = currentScroll < lastScroll;

  const rect = cover.getBoundingClientRect();
  const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom));
  const totalHeight = cover.offsetHeight;
  const hiddenRatio = 1 - (visibleHeight / totalHeight);
  const opacity = Math.min(hiddenRatio * 1.5, 1.0); // puedes ajustar el 1.5 y 0.5

  if (scrollingUp) {
    if (coverImageOverlay) coverImageOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
    if (landscapeImageOverlay) landscapeImageOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
  } else {
    // Al bajar, se limpia
    if (coverImageOverlay) coverImageOverlay.style.background = 'rgba(0, 0, 0, 0)';
    if (landscapeImageOverlay) landscapeImageOverlay.style.background = 'rgba(0, 0, 0, 0)';
  }

  lastScroll = currentScroll;
}

window.addEventListener('scroll', updateOverlayOpacity);

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

  // Barra espaciadora -> play/pausa del video
  case ' ':
  case 'Spacebar': // por compatibilidad vieja
    const video = document.querySelector('video'); // el <video> de video.js
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      e.preventDefault();
    }
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

  window.playEpisode = playEpisode;


// === MENÚ DE IDIOMAS: versión robusta que fuerza carga, fallback y loggea errores ===
(function () {
  const getPlayer = () => (typeof videojs !== 'undefined' && videojs.getPlayer) ? videojs.getPlayer('video') : (window._videoInstance || null);
  const langBtnWrapper = document.getElementById("langBtnWrapper");
  const langMenu = document.getElementById("langMenu");
  const langOptions = document.querySelectorAll(".lang-option");
  const langIcon = document.getElementById("langIcon");
  const langConfirmBtn = document.getElementById("langConfirmBtn");
  const overlayBg = document.getElementById("overlay");

  let currentLang = localStorage.getItem('preferredLang') || "latino";
  let selectedLang = currentLang;
  let currentEpisode = null;
  let menuOpen = false;

  function findEpisodeByUrl(url) {

  if (!url || !window.playlist) return null;

  for (const season of window.playlist) {

    for (const ep of season.episodes) {

      // El episodio puede tener varias URLs:
      // latino, sub, inglés, etc.
      const urls = Object.values(ep.videos || {});

      if (
        ep.videoUrl === url ||
        urls.includes(url)
      ) {
        return ep;
      }

    }
  }

  return null;
}
  
  

  function openMenu() {
    selectedLang = currentLang;
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
    if (langMenu) langMenu.style.display = 'flex';
    if (overlayBg) overlayBg.style.display = 'block';
    const p = getPlayer();
    if (p && typeof p.pause === 'function') p.pause();
    menuOpen = true;
  }

  function closeMenu(hacerPlay = true) {
    if (langMenu) langMenu.style.display = 'none';
    if (overlayBg) overlayBg.style.display = 'none';
    const p = getPlayer();
    if (hacerPlay && p && typeof p.play === 'function') p.play().catch(()=>{});
    menuOpen = false;
  }

  function selectLanguage(lang) {
    selectedLang = lang;
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
  }

 // ---------- REEMPLAZA confirmAndPlay con esta versión ----------
function confirmAndPlay() {
  const p = getPlayer();

  // 1️⃣ Detectar SIEMPRE el episodio actual desde la URL
//    Nunca confiar únicamente en currentEpisode porque puede estar desactualizado.
const cur = p && typeof p.currentSrc === 'function'
    ? p.currentSrc()
    : (document.getElementById('videoSource')?.src || null);

const detectedEpisode = findEpisodeByUrl(cur);

if (detectedEpisode) {
    currentEpisode = detectedEpisode;
}

console.log(
    '[lang] Episodio detectado:',
    currentEpisode?.episodeCode,
    'URL actual:',
    cur
);

  // 🔒 Guardar exactamente qué episodio estamos viendo
let currentSeasonIndex = -1;
let currentEpisodeIndex = -1;

for (let s = 0; s < window.playlist.length; s++) {
  const index = window.playlist[s].episodes.indexOf(currentEpisode);

  if (index !== -1) {
    currentSeasonIndex = s;
    currentEpisodeIndex = index;
    break;
  }
}

  if (!currentEpisode) {
    console.warn('[lang] No se detectó episodio actual.');
    closeMenu(true);
    return;
  }

  // 2️⃣ Guardar tiempo actual antes del cambio
  const oldTime = (p && typeof p.currentTime === 'function')
    ? p.currentTime()
    : (document.querySelector('#video')?.currentTime || 0);

  // 3️⃣ Actualizar idioma seleccionado
  currentLang = selectedLang;
  localStorage.setItem('preferredLang', currentLang);
  if (langIcon) langIcon.textContent = (currentLang === 'latino') ? 'chat' : 'subtitles';

  // 4️⃣ Obtener URL correspondiente al idioma
  // 🔒 Obtener nuevamente el episodio por su posición,
// no por la URL del idioma anterior
if (
  currentSeasonIndex >= 0 &&
  currentEpisodeIndex >= 0 &&
  window.playlist[currentSeasonIndex]?.episodes[currentEpisodeIndex]
) {
  currentEpisode =
    window.playlist[currentSeasonIndex]
      .episodes[currentEpisodeIndex];
}

const newUrl = currentEpisode.videos?.[currentLang];

// 🔒 Mantener siempre el mismo episodio al cambiar idioma
localStorage.setItem(`last-episode-${seriesId}`, JSON.stringify({
  seasonIndex: currentSeasonIndex,
  episodeIndex: currentEpisodeIndex
}));

  if (!newUrl) {
    console.warn('[lang] No existe URL para el idioma seleccionado.', currentEpisode.videos);
    closeMenu(true);
    return;
  }

  console.log('[lang] Cambiando idioma a:', currentLang, 'URL:', newUrl, 'desde:', oldTime);

  // 5️⃣ Cambiar fuente en el reproductor o DOM
  if (p && typeof p.src === 'function') {
    try {
    // NO borrar todos los listeners de loadedmetadata.
} catch (e) {}

    p.pause && p.pause();
    p.src({ type: 'video/mp4', src: newUrl });

    let handled = false;
    const onMeta = () => {
      if (handled) return;
      handled = true;
      try { p.currentTime(oldTime); } catch(e) {
        const dom = document.getElementById('video');
        if (dom) dom.currentTime = oldTime;
      }
      p.play().catch(err => console.warn('[lang] play() fallo:', err));
    };

    if (typeof p.one === 'function') {
      p.one('loadedmetadata', onMeta);
    } else if (typeof p.on === 'function') {
      const wrap = () => { onMeta(); p.off && p.off('loadedmetadata', wrap); };
      p.on('loadedmetadata', wrap);
    } else {
      const dom = document.getElementById('video');
      if (dom) dom.addEventListener('loadedmetadata', onMeta, { once: true });
    }

    setTimeout(() => {
      if (!handled) {
        console.warn('[lang] loadedmetadata no llegó a tiempo, forzando seek/play.');
        try { p.currentTime(oldTime); } catch(e) {
          const dom = document.getElementById('video');
          if (dom) dom.currentTime = oldTime;
        }
        p.play().catch(()=>{});
        handled = true;
      }
    }, 3500);
  } else {
    const dom = document.getElementById('video');
    const sourceEl = document.getElementById('videoSource');
    if (!dom || !sourceEl) {
      console.error('[lang] No hay player ni elemento video DOM.');
      closeMenu(true);
      return;
    }
    try {
      dom.pause();
      sourceEl.src = newUrl;
      dom.load();
    } catch (e) { console.error('[lang] error al setear src DOM:', e); }

    dom.addEventListener('loadedmetadata', function onMetaDOM() {
      dom.currentTime = oldTime;
      dom.play().catch(()=>{});
      dom.removeEventListener('loadedmetadata', onMetaDOM);
    }, { once: true });

    setTimeout(() => {
      if (!dom.paused) return;
      try { dom.currentTime = oldTime; dom.play().catch(()=>{}); } catch(e) {}
    }, 3500);
  }

  // 6️⃣ Guardar progreso actualizado
 // 6️⃣ Guardar progreso actualizado
try {

  const key = `progress-${seriesId}`;
  const episodios =
    JSON.parse(localStorage.getItem(key) || '{}');

  // Guardar el progreso en la URL nueva
  episodios[newUrl] = {
    progress: oldTime,
    updated_at: Date.now()
  };

  localStorage.setItem(
    key,
    JSON.stringify(episodios)
  );

  // 🔥 IMPORTANTE:
  // last-episode debe representar el episodio,
  // no la versión de idioma.
  //
  // Guardamos la URL nueva solamente como la versión
  // que se está reproduciendo actualmente.
  

} catch (e) {

  console.warn(
    '[lang] no se pudo guardar progreso:',
    e
  );

}

  // 7️⃣ 🔁 Actualizar el botón "Continuar viendo" en vivo
  try {
    const button = document.getElementById('resumeButton');
    if (button && currentEpisode) {
      const label = 'Continuar ' + (currentEpisode.hiddenCode || '');
      button.innerHTML = `
        <div class="resume-text-wrapper">
          <span class="material-icons">play_arrow</span>
          <div class="text-with-bar">
            <div class="resume-label">${label}</div>
            <div class="resume-progress-track">
              <div class="resume-progress-bar" style="width: 0%;"></div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.warn('[lang] No se pudo actualizar el botón resume en vivo:', err);
  }

  if (typeof updateResumeButton === 'function') updateResumeButton();

  closeMenu(true);
}
// ---------- FIN confirmAndPlay ----------


  // UI events
  langBtnWrapper?.addEventListener('click', (e) => { e.stopPropagation(); openMenu(); });
  langOptions.forEach(option => option.addEventListener('click', (e) => { e.stopPropagation(); selectLanguage(option.dataset.lang); }));
  langConfirmBtn?.addEventListener('click', (e) => { e.stopPropagation(); confirmAndPlay(); });

  function handleOutsideClose(e) {
    if (!menuOpen) return;
    if (!langMenu.contains(e.target) && !langBtnWrapper.contains(e.target)) confirmAndPlay();
  }
  document.addEventListener('click', handleOutsideClose, true);
  document.addEventListener('touchstart', handleOutsideClose, true);

  // listen playEpisode events to keep currentEpisode updated
  window.addEventListener('playEpisode', (e) => {
    currentEpisode = e?.detail || null;
    if (!currentEpisode) {
      const p = getPlayer();
      const cur = p && typeof p.currentSrc === 'function' ? p.currentSrc() : (document.getElementById('videoSource')?.src || null);
      currentEpisode = findEpisodeByUrl(cur);
    }
    // update lang icon with preferred
    const pref = localStorage.getItem('preferredLang') || currentLang;
    if (langIcon) langIcon.textContent = (pref === 'latino') ? 'chat' : 'subtitles';
  });

  // update currentEpisode when metadata loads (covers direct loads)
  const p0 = getPlayer();
  if (p0 && typeof p0.on === 'function') {
    p0.on('loadedmetadata', function() {

  const cur =
    p0 && typeof p0.currentSrc === 'function'
      ? p0.currentSrc()
      : (document.getElementById('videoSource')?.src || null);

  const detectedEpisode = findEpisodeByUrl(cur);

  if (detectedEpisode) {
    currentEpisode = detectedEpisode;
  }

});

  } else {
    const dom = document.getElementById('video');
    dom && dom.addEventListener('loadedmetadata', function() {
      currentEpisode = findEpisodeByUrl(dom.currentSrc || document.getElementById('videoSource')?.src);
    });
  }

})();


document.body.style.position = '';
document.body.style.top = '';
document.body.style.width = '';

window.seriesName = document.getElementById("nombre")?.innerText.trim() || "Serie";

console.log("Serie detectada:", window.seriesName);


