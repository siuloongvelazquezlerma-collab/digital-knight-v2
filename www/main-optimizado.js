/* Optimizaciones seguras para main-optimizado.html.
   Reduce solo el tamaño de las imágenes TMDB, sin cambiar el contenido. */
(function () {
  const tmdbOriginalRegex = /https?:\/\/(?:image\.tmdb\.org|www\.themoviedb\.org)\/t\/p\/original\//i;

  function tmdbSizeFor(image) {
    if (image.closest('.swiper, .hero, .banner, .featured')) return 'w1280';
    if (image.closest('.continue-watching, .top-10, .card, .scroll-container, .scroll-wrapper, .horizontal-scroll-container, .movie-section, .poster-wrapper')) return 'w300';
    if (image.closest('.movie-item')) return 'w500';
    return 'w300';
  }

  function replaceTmdbOriginal(url, size) {
    if (typeof url !== 'string' || !tmdbOriginalRegex.test(url)) return url;
    return url.replace(tmdbOriginalRegex, `https://image.tmdb.org/t/p/${size}/`);
  }

  function optimizeAttribute(element, attribute) {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const optimized = replaceTmdbOriginal(value, tmdbSizeFor(element));
    if (optimized !== value) element.setAttribute(attribute, optimized);
  }

  document.querySelectorAll('img[data-src], img[src]').forEach((image) => {
    if (image.dataset.src) optimizeAttribute(image, 'data-src');
    if (image.src) optimizeAttribute(image, 'src');
    if (image.srcset) optimizeAttribute(image, 'srcset');
    image.decoding = 'async';
  });

  document.querySelectorAll('[style]').forEach((element) => {
    const styleValue = element.getAttribute('style');
    if (!styleValue || !tmdbOriginalRegex.test(styleValue)) return;
    element.setAttribute('style', replaceTmdbOriginal(styleValue, 'w1280'));
  });

  document.querySelectorAll('#inicio .swiper-slide img').forEach((image, index) => {
    if (index === 0) image.fetchPriority = 'high';
  });
})();
