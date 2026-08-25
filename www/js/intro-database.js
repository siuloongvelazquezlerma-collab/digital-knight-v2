/* ============================================================================
 * INTRO DATABASE (detección automática de intros)
 * ----------------------------------------------------------------------------
 * Este archivo es un DATO estático (NO se ejecuta análisis aquí).
 * El análisis pesado lo hace la herramienta independiente del mantenedor:
 *     tools/intro-detector/
 * El resultado se vuelca aquí, en formato:
 *
 *   window.introDatabase = {
 *     "<seriesId>": {
 *       "<índiceTemporada>": { "start": X, "end": Y, "source": "auto ..." },
 *       ...
 *     }
 *   }
 *
 * PRIORIDAD EN EL REPRODUCTOR:
 *   1) intro manual válida del episodio  -> manda
 *   2) intro automática de esta tabla    -> se usa si no hay manual válida
 *   3) si nada -> botón "Saltar intro" oculto
 *
 * Las claves de temporada son el ÍNDICE dentro de window.playlist (el mismo
 * que usa <select id="seasonSelect">). Así la base sirve para muchas series,
 * muchas temporadas y cambios de intro por temporada sin tocar player-series.js.
 * ========================================================================== */
window.introDatabase = {
  // Ejemplo (estructura), se completará con los datos reales de cada serie:
  // "la-teoria-del-big-bang-1418": {
  //   "0": { "start": 0, "end": 22, "source": "auto: temporada 1 (s1e1..s1e6)" }
  // }
};
