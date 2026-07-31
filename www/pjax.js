console.log("PJAX cargado");
// =======================================
// Digital Knight Smart Navigation
// =======================================

const prefetchedPages = new Map();

// Precargar cuando el usuario pasa el mouse
document.addEventListener("mouseover", preloadLink);

// En móviles, cuando toca el enlace
document.addEventListener("touchstart", preloadLink, {
    passive: true
});

function preloadLink(e) {

    const link = e.target.closest("a");

    if (!link) return;

    if (link.origin !== location.origin) return;

    const url = link.href;

    if (prefetchedPages.has(url)) return;

    fetch(url)
        .then(r => r.text())
        .then(html => {

            prefetchedPages.set(url, html);

            console.log("Precargado:", url);

        })
        .catch(() => {});
}

// Navegación suave
document.addEventListener("click", function(e){

    const link = e.target.closest("a");

    if (!link) return;

    // Solo enlaces internos
    if (link.origin !== location.origin) return;

    // Ignorar enlaces especiales
    if (
        link.target === "_blank" ||
        link.href.includes("#") ||
        link.hasAttribute("download")
    ) return;

    e.preventDefault();

    document.body.classList.add("page-transition");

    setTimeout(() => {
        location.href = link.href;
    }, 120);

});