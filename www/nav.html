// 🌀 Oculta transiciones visuales del navegador (barra superior, flashes, etc.)
(function() {
  // Fondo de la app (debe coincidir con tu loader)
  document.body.style.backgroundColor = "#01011d";
  document.body.style.transition = "opacity 0.25s ease";

  // Detecta clics en enlaces normales
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    // Ignora enlaces especiales
    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      link.target === '_blank' ||
      link.hasAttribute('download')
    ) return;

    // Aplica fundido antes de que el navegador cambie de página
    document.body.style.opacity = '0';
  });

  // Restaura opacidad al cargar
  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '1';
  });
})();

let navegando = false;
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link || navegando) return;

  const href = link.getAttribute('href');
  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('javascript:') ||
    link.target === '_blank' ||
    link.hasAttribute('download')
  ) return;

  navegando = true;
  document.body.style.opacity = '0';
});
