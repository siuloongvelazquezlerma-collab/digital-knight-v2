(function () {
  const video =
  document.querySelector(".vjs-tech") ||
  document.querySelector("video");
  const source = document.getElementById("videoSource");
  const langBtnWrapper = document.getElementById("langBtnWrapper");
  const langMenu = document.getElementById("langMenu");
  const langOptions = document.querySelectorAll(".lang-option");
  const langIcon = document.getElementById("langIcon");
  const langConfirmBtn = document.getElementById("langConfirmBtn");
  const overlayBg = document.getElementById("overlay");

  const videos = window.movieLanguages || {};

  console.log("VIDEO:", video);
console.log("TAG:", video.tagName);
console.log("PAUSE:", typeof video.pause);



  let currentLang = "latino";       // idioma que está reproduciéndose
  let selectedLang = currentLang;   // idioma elegido dentro del menú (temporal)
  let menuOpen = false;             // 👈 bandera de estado del menú

  // helper: mostrar/ocultar modal
  function openMenu() {
    selectedLang = currentLang;
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
    langMenu.style.display = 'flex';
    if (overlayBg) overlayBg.style.display = 'block';
    video.pause();
    menuOpen = true; // 👈 marcar que el menú está abierto
  }

  function closeMenu(hacerPlay = true) {
    langMenu.style.display = 'none';
    if (overlayBg) overlayBg.style.display = 'none';
    if (hacerPlay) {
      video.play().catch(()=>{});
    }
    menuOpen = false; // 👈 menú cerrado
  }

  // Selección de idioma: precarga la fuente (pero no reproduce aún)
  function selectLanguage(lang) {
    if (!videos[lang]) return;
    const curTime = video.currentTime || 0;
    selectedLang = lang;

    // Marcar visualmente la opción
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
    langIcon.textContent = (selectedLang === 'latino') ? 'chat' : 'subtitles';

    source.src = videos[selectedLang];
    video.load();

    const onLoadedMeta = () => {
      try {
        video.currentTime = Math.min(curTime, video.duration || curTime);
      } catch {}
      video.removeEventListener('loadedmetadata', onLoadedMeta);
    };
    video.addEventListener('loadedmetadata', onLoadedMeta, { once: true });

    console.log('Idioma seleccionado (precargando):', selectedLang);
  }

  // Confirmar selección y reanudar
  function confirmAndPlay() {
    if (selectedLang && selectedLang !== currentLang) {
      currentLang = selectedLang;
    }
    closeMenu(true);
  }

  // Inicializar opción activa al cargar
  document.addEventListener('DOMContentLoaded', () => {
    langOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === currentLang);
    });
  });

  // Abrir menú
  langBtnWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenu();
  });

  // Selección de idioma
  langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = option.dataset.lang;
      selectLanguage(lang);
    });
  });

  // Confirmación con botón "Listo"
  if (langConfirmBtn) {
    langConfirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Listo clicado');
      confirmAndPlay();
    });
  }

  // 👉 Detectar click/touch global (desktop y móvil)
  function handleOutsideClose(e) {
    if (!menuOpen) return; // si no está abierto, nada
    if (!langMenu.contains(e.target) && !langBtnWrapper.contains(e.target)) {
      console.log('Clic/touch fuera: cerrar menú');
      e.stopPropagation(); // evitar que afecte a controles
      e.preventDefault();
      confirmAndPlay();
    }
  }

  document.addEventListener('click', handleOutsideClose, true);
  document.addEventListener('touchstart', handleOutsideClose, true);

})();