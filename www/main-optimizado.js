/* Optimizaciones seguras para main-optimizado.html.
   No cambia rutas, datos de Supabase, favoritos ni "Continuar viendo". */
(function () {
  const originalPath = '/t/p/original/';

  function tmdbSizeFor(image) {
    if (image.closest('.swiper, .hero, .banner, .featured')) return 'w1280';
    if (image.closest('.movie-item, .continue-watching')) return 'w500';
    return 'w342';
  }

  function optimizeTmdbUrl(url, size) {
    return typeof url === 'string' && url.includes('image.tmdb.org' + originalPath)
      ? url.replace(originalPath, '/t/p/' + size + '/')
      : url;
  }

  document.querySelectorAll('img[data-src], img[src]').forEach((image) => {
    const attribute = image.dataset.src ? 'data-src' : 'src';
    const current = image.getAttribute(attribute);
    const optimized = optimizeTmdbUrl(current, tmdbSizeFor(image));
    if (optimized !== current) image.setAttribute(attribute, optimized);
    image.decoding = 'async';
  });

  document.querySelectorAll('[style*="image.tmdb.org/t/p/original/"]').forEach((element) => {
    const value = element.getAttribute('style');
    if (!value) return;
    const optimized = value.replaceAll('/t/p/original/', '/t/p/w1280/');
    element.setAttribute('style', optimized);
  });

  /* Las imágenes críticas se priorizan; el resto conserva el lazy load original. */
  document.querySelectorAll('#inicio .swiper-slide img').forEach((image, index) => {
    if (index === 0) image.fetchPriority = 'high';
  });
})();
