// ============================================================
// 📦 render-main-json.js
// Lee main-data.json y puebla los carruseles de main.html.
//
// CÓMO FUNCIONA:
// Cada <div class="scroll-container" id="seccion-<tab>-<Seccion>">
// o id="top10-<tab>-<Seccion>" se rellena con los ítems que
// trae la JSON. Las imágenes se insertan con data-src (lazy),
// y main-optimizado.js las carga al hacer scroll automáticamente.
//
// Uso: <script src="render-main-json.js"></script>  (se ejecuta solo)
// ============================================================

(function () {
  const PLACEHOLDER =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='200'></svg>";

  // Normaliza un título a un "slug" comparando con el id del contenedor
  function slugify(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function crearEnlace(item) {
    const a = document.createElement('a');
    a.href = item.link || '#';

    const img = document.createElement('img');
    img.setAttribute('src', PLACEHOLDER);
    if (item.image) img.setAttribute('data-src', item.image);
    if (item.alt) img.setAttribute('alt', item.alt);
    img.classList.add('lazy-img');

    a.appendChild(img);
    return a;
  }

  function crearTarjetaTop10(item) {
    const card = document.createElement('div');
    card.classList.add('card');

    const span = document.createElement('span');
    span.classList.add('rank-number');
    span.textContent = item.rank || '';
    card.appendChild(span);

    const a = document.createElement('a');
    a.href = item.link || '#';

    const img = document.createElement('img');
    img.setAttribute('src', PLACEHOLDER);
    if (item.image) img.setAttribute('data-src', item.image);
    if (item.alt) img.setAttribute('alt', item.alt);
    img.classList.add('lazy-img');

    a.appendChild(img);
    card.appendChild(a);
    return card;
  }

  function rellenarContenedor(cont, seccion) {
    if (!cont || !seccion || !Array.isArray(seccion.items)) return;

    // Evitar duplicados si el script ya corrió una vez
    if (cont.getAttribute('data-render-json') === '1') return;
    cont.setAttribute('data-render-json', '1');

    if (seccion.container === 'top10') {
      seccion.items.forEach(item => {
        cont.appendChild(crearTarjetaTop10(item));
      });
    } else {
      seccion.items.forEach(item => {
        cont.appendChild(crearEnlace(item));
      });
    }
  }

  function cargar(host = 'main-data.json') {
    try {
      fetch(host)
        .then(r => r.json())
        .then(data => {
          const tabs = data.tabs || {};
          const contenedores = document.querySelectorAll('[id^="seccion-"]');

          contenedores.forEach(cont => {
            const resto = cont.id.replace('seccion-', ''); // ej: "inicio-Colecciones"
            const guion = resto.indexOf('-');
            if (guion === -1) return;
            const tab = resto.slice(0, guion);
            const nomSeccion = resto.slice(guion + 1); // ej: "Colecciones"

            const tabData = tabs[tab];
            if (!tabData) return;

            // Igualamos por título (slug) o por nombre exacto
            const seccion = (tabData.sections || []).find(
              s =>
                slugify(s.title) === slugify(nomSeccion) ||
                s.title.trim() === nomSeccion.trim()
            );

            rellenarContenedor(cont, seccion);
          });

          // 🔁 Lazy-load de las imágenes inyectadas: copia data-src→src
          // cuando la imagen está cerca de verse, igual que script.js.
          lazyObservarImagenesNuevas();
        });
    } catch (err) {
      console.warn('render-main-json: no se pudo leer la JSON', err);
    }
  }

  // Vigila SOLO las imágenes lazy inyectadas desde la JSON (con data-src).
  // Al entrar en pantalla, pasa data-src → src y las desbloquea.
  function lazyObservarImagenesNuevas() {
    // Las que ya tenga data-src (o src placeholder) y no hayan sido cargadas.
    let imagenes = [];
    document.querySelectorAll('[id^="seccion-"] img.lazy-img').forEach(
      img => {
        if (img.getAttribute('data-src')) imagenes.push(img);
      }
    );
    if (!imagenes.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
        }
        img.classList.add('loaded');
        observer.unobserve(img);
      });
    }, {
      rootMargin: '400px 0px',
      threshold: 0
    });

    imagenes.forEach(img => observer.observe(img));
  }

  // Ejecutar al cargar (el fetch es asíncrono pero el DOM ya está listo aquí)
  window.renderSectionsFromJson = cargar;
  cargar();
})();