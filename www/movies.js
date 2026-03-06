const searchInput = document.getElementById('searchInput');
const movieContainer = document.getElementById('movieContainer');
const noResults = document.getElementById('noResults');
const clearIcon = document.getElementById('clearIcon');
const genreContainer = document.getElementById('genreContainer');

// --------------------
// Mostrar las películas con prioridad a coincidencias al inicio
// --------------------
function renderMovies(query = "") {
    movieContainer.innerHTML = ""; // Limpiar resultados anteriores
    noResults.style.display = "none"; // Ocultar mensaje de no resultados

    if (!query) {
        genreContainer.style.display = "block";
        return;
    } else {
        genreContainer.style.display = "none";
    }

    const queryLower = query.toLowerCase();

    // Coincidencias que empiezan con la query
    const startsWithMatches = movies.filter(movie => {
        return movie.title.toLowerCase().startsWith(queryLower) ||
               movie.hiddenTitles?.some(ht => ht.toLowerCase().startsWith(queryLower));
    });

    // Coincidencias parciales que no estén ya en startsWithMatches
    const partialMatches = movies.filter(movie => {
        const inStartsWith = startsWithMatches.includes(movie);
        const titleIncludes = movie.title.toLowerCase().includes(queryLower);
        const hiddenIncludes = movie.hiddenTitles?.some(ht => ht.toLowerCase().includes(queryLower));
        return !inStartsWith && (titleIncludes || hiddenIncludes);
    });

    const filteredMovies = [...startsWithMatches, ...partialMatches];

    if (filteredMovies.length === 0) {
        noResults.style.display = "block";
        return;
    }

    filteredMovies.forEach(movie => {
        const movieItem = document.createElement("a");
        movieItem.classList.add("movie-item");
        movieItem.href = movie.link;
        movieItem.innerHTML = `
          <img src="${movie.poster}" alt="${movie.title}">
          <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-details">${movie.details}</div>
          </div>
        `;
        movieContainer.appendChild(movieItem);
    });
}

// --------------------
// Eventos de búsqueda
// --------------------
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    renderMovies(query);
    clearIcon.classList.toggle('visible', query.length > 0);
});

clearIcon.addEventListener('click', () => {
    searchInput.value = "";
    renderMovies("");
    clearIcon.classList.remove('visible');
});

// --------------------
// Restaurar búsqueda desde sessionStorage
// --------------------
window.addEventListener("load", () => {
    const savedQuery = sessionStorage.getItem("searchQuery") || "";
    const savedScroll = parseInt(sessionStorage.getItem("searchScroll")) || 0;

    if (savedQuery) {
        searchInput.value = savedQuery;
        renderMovies(savedQuery);
        window.scrollTo(0, savedScroll);
    }
});

// Guardar búsqueda y scroll antes de salir
document.addEventListener("click", (e) => {
    const target = e.target.closest("a.movie-item");
    if (!target) return;

    sessionStorage.setItem("searchQuery", searchInput.value.trim());
    sessionStorage.setItem("searchScroll", window.scrollY);
});

// --------------------
// Loader
// --------------------
window.addEventListener('load', function () {
    const overlay = document.querySelector('.overlay');
    const loader = document.getElementById('loader');

    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            overlay.classList.add('hidden');
        }, 300);
    }, 1000);
});

// --------------------
// Gestión de imágenes de perfil
// --------------------
const footerProfileIcon = document.getElementById("footerIconImg");
const profileImage = document.getElementById("profileImage");
const profilePageImage = document.getElementById("profilePageImage");
const headerProfileIcon = document.getElementById("headerProfileIcon");

const defaultProfileIcon = document.getElementById("defaultProfileIcon");
const defaultProfileIconAlt = document.getElementById("defaultProfileIconAlt");

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

    if (defaultProfileIcon) defaultProfileIcon.style.display = "none";
    if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = "none";

    localStorage.setItem("profileImage", src);
}

window.addEventListener("load", () => {
    const storedProfileImage = localStorage.getItem("profileImage");
    if (storedProfileImage) updateProfileImage(storedProfileImage);
});

// --------------------
// Footer responsive
// --------------------
// Footer responsive
var lastScrollTop = 0;
var footer = document.querySelector(".footer");

function updateFooterVisibility(scrollContainer = window) {
    if (!footer) return;

    let currentScroll = 0;

    if (scrollContainer === window) {
        currentScroll = window.scrollY;
    } else {
        currentScroll = scrollContainer.scrollTop;
    }

    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
        footer.classList.add("hidden");
    } else {
        if (currentScroll > lastScrollTop && currentScroll > 50) {
            footer.classList.add("hidden");
        } else {
            footer.classList.remove("hidden");
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }
}

// Escuchar scroll en window y en contenedores con scroll
window.addEventListener("scroll", () => updateFooterVisibility(window));
window.addEventListener("resize", () => updateFooterVisibility(window));


const scrollContainers = [
  window,
  document.getElementById("movieContainer"),
  document.querySelector(".genre-scroll")
];

function updateFooterVisibility(container) {
  const scrollTop = container === window ? window.scrollY : container.scrollTop;
  const isDesktop = window.innerWidth >= 1024;

  if (isDesktop) {
    footer.classList.add("hidden"); // siempre oculto en desktop
  } else {
    if (scrollTop > lastScrollTop && scrollTop > 50) {
      footer.classList.add("hidden");
    } else {
      footer.classList.remove("hidden");
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
}

// Añadir listener a todos los contenedores
scrollContainers.forEach(container => {
  if (container) {
    container.addEventListener("scroll", () => updateFooterVisibility(container));
  }
});

// También al redimensionar la ventana
window.addEventListener("resize", () => updateFooterVisibility(window));

// Inicializar visibilidad al cargar
updateFooterVisibility(window);


// --------------------
// Navegación por teclado
// --------------------
document.addEventListener('keydown', function(e) {
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    const focusable = Array.from(document.querySelectorAll('[tabindex]:not([disabled])'));
    const current = document.activeElement;
    const currentIndex = focusable.indexOf(current);

    switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            if (currentIndex > 0) focusable[currentIndex - 1].focus();
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'ArrowDown':
            if (currentIndex < focusable.length - 1) focusable[currentIndex + 1].focus();
            e.preventDefault();
            break;
        case 'Enter':
        case 'OK':
            if (document.activeElement) document.activeElement.click();
            e.preventDefault();
            break;
    }
});

window.addEventListener('keydown', function(e) {
    const tag = document.activeElement.tagName.toLowerCase();
    if ((e.key === 'Backspace' || e.key === 'BrowserBack') && tag !== 'input' && tag !== 'textarea') {
        history.back();
        e.preventDefault();
    }
});



// --------------------
// Guardar búsqueda y scroll antes de salir (click o touch en móviles)
// --------------------
function saveSearch() {
  const now = Date.now();
  sessionStorage.setItem("searchQuery", searchInput.value.trim());
  sessionStorage.setItem("searchScroll", window.scrollY);
  sessionStorage.setItem("searchTimestamp", now); // Guardamos el timestamp
}

document.addEventListener("click", (e) => {
  if (e.target.closest("a.movie-item")) saveSearch();
});

document.addEventListener("touchend", (e) => {
  if (e.target.closest("a.movie-item")) saveSearch();
});

// --------------------
// Restaurar búsqueda desde sessionStorage con expiración y activar input
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  const savedQuery = sessionStorage.getItem("searchQuery") || "";
  const savedScroll = parseInt(sessionStorage.getItem("searchScroll")) || 0;
  const savedTime = parseInt(sessionStorage.getItem("searchTimestamp")) || 0;

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutos en ms

  if (savedQuery && (now - savedTime) <= fiveMinutes) {
      searchInput.value = savedQuery;
      renderMovies(savedQuery);

      // Pequeño delay para webviews móviles
      setTimeout(() => {
          window.scrollTo(0, savedScroll);

          // Activar input de búsqueda
          searchInput.focus({ preventScroll: true });

          // En móviles, abrir teclado virtual
          if (/Mobi|Android/i.test(navigator.userAgent)) {
              searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
          }
      }, 50);
  } else {
      // Limpiar si expiró
      sessionStorage.removeItem("searchQuery");
      sessionStorage.removeItem("searchScroll");
      sessionStorage.removeItem("searchTimestamp");

      // Activar input vacío
      searchInput.focus();
  }
});



