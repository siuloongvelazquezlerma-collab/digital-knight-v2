// Inicializar Swiper

  // Inicializar Swiper
  const swiper = new Swiper('.swiper', {
    loop: true,
    autoplay: {
      delay: 7000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });

  // Referencia a la paginación DOM
  function positionPagination() {
    const paginationEl = document.querySelector('.swiper-pagination');
    const swiperEl = document.querySelector('.swiper');
    const activeSlide = document.querySelector('.swiper-slide-active');
    const info = activeSlide?.querySelector('.info');
  
    if (!paginationEl || !swiperEl) return;
  
    const isLandscape = window.innerWidth > window.innerHeight;
  
    if (info) {
      const swiperRect = swiperEl.getBoundingClientRect();
      const infoRect = info.getBoundingClientRect();
  
      // 20px debajo de la info
      const bottomOffset = swiperRect.bottom - infoRect.bottom + -30;
  
      if (isLandscape) {
        paginationEl.style.left = '5%';
        paginationEl.style.bottom = `${bottomOffset}px`;
        paginationEl.style.textAlign = 'left';
        paginationEl.style.transform = 'none';
      } else {
        paginationEl.style.left = '50%';
        paginationEl.style.bottom = `${bottomOffset}px`;
        paginationEl.style.textAlign = 'center';
        paginationEl.style.transform = 'translateX(-50%)';
      }
    } else {
      // Fallback
      paginationEl.style.bottom = isLandscape ? '20px' : '40px';
      paginationEl.style.left = isLandscape ? '5%' : '50%';
      paginationEl.style.transform = isLandscape ? 'none' : 'translateX(-50%)';
      paginationEl.style.textAlign = isLandscape ? 'left' : 'center';
    }
  }
  
  // Escuchar cambios de tamaño y orientación
  window.addEventListener('resize', positionPagination);
  window.addEventListener('orientationchange', positionPagination);
  
  // Ejecutar al cargar y al cambiar slide
  swiper.on('init', positionPagination);
  swiper.on('slideChangeTransitionEnd', positionPagination);
  window.addEventListener('load', () => setTimeout(positionPagination, 50));
  
  
  
  

  // Animación de barra interna: reset / start
  function resetBulletsProgress() {
    document.querySelectorAll('.swiper-pagination-bullet').forEach(bullet => {
      bullet.style.setProperty('--progress', '0');
    });
  }
  function startActiveBulletProgress() {
    const active = document.querySelector('.swiper-pagination-bullet-active');
    if (active) active.style.setProperty('--progress', '100%');
  }

  // Eventos Swiper
  swiper.on('init', () => {
    positionPagination();
    startActiveBulletProgress();
  });

  swiper.on('slideChangeTransitionStart', () => {
    resetBulletsProgress();
  });

  swiper.on('slideChangeTransitionEnd', () => {
    positionPagination();
    startActiveBulletProgress();
  });

  // También reaccionar a resize y a carga
  window.addEventListener('resize', positionPagination);
  window.addEventListener('load', () => {
    // small delay para que se renderice todo
    setTimeout(() => {
      positionPagination();
      startActiveBulletProgress();
    }, 50);
  });

  // Si el swiper ya está creado (normal), forzamos una primera posición
  setTimeout(positionPagination, 60);


  
  
  
  document.querySelectorAll(".save").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const slide = btn.closest(".swiper-slide");
      const playBtn = slide.querySelector(".play");
  
      const href = playBtn ? playBtn.getAttribute("href") : "#";
      const img = slide.querySelector("img") ? slide.querySelector("img").src : "";
  
      let favs = JSON.parse(localStorage.getItem("favoritos")) || [];
      const existe = favs.some(fav => fav.href === href);
  
      const icon = btn.querySelector("i");
  
      if (existe) {
        // Quitar de favoritos
        favs = favs.filter(fav => fav.href !== href);
        localStorage.setItem("favoritos", JSON.stringify(favs));
  
        // Icono vacío
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
  
      } else if (href !== "#") {
        // Agregar a favoritos
        favs.push({ href, img });
        localStorage.setItem("favoritos", JSON.stringify(favs));
  
        // Icono lleno
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
      }
    });
  });
  
  // Restaurar estado al cargar
  window.addEventListener("DOMContentLoaded", () => {
    let favs = JSON.parse(localStorage.getItem("favoritos")) || [];
    document.querySelectorAll(".save").forEach(btn => {
      const slide = btn.closest(".swiper-slide");
      const playBtn = slide.querySelector(".play");
      const href = playBtn ? playBtn.getAttribute("href") : "#";
      const icon = btn.querySelector("i");
  
      if (favs.some(fav => fav.href === href)) {
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
      }
    });
  });
  
  
  