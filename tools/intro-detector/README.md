# intro-detector

Herramienta **independiente** (para el mantenedor) que detecta automáticamente
las intros de una serie. **No se ejecuta para los usuarios** y no forma parte
del reproductor: solo genera los datos que después consume `player-series.js`
a través de `window.introDatabase` (`www/js/intro-database.js`).

## Requisitos
- Node.js >= 18.
- ffmpeg: NO hace falta instalarlo en el sistema. Este proyecto lo trae
  empaquetado vía `ffmpeg-static`/`ffprobe-static` (se baja solo en `npm install`).
  Si prefieres usar el ffmpeg de tu sistema, basta con que esté en el PATH.

## Instalación (una vez)
```bash
cd tools/intro-detector
npm install
```

## Uso
```bash
node detect.mjs --html "../../www/series/la-teoria-del-big-bang.html" --season 1 --sample 6 --window 240
```
- `--html` : ruta (relativa a `tools/intro-detector`) al HTML de la serie.
- `--season` : número de temporada (1 = primera).
- `--sample` : cuántos episodios tomar como muestra (recomendado 6-8).
- `--window` : cuántos segundos del inicio de cada episodio analizar.
- `--threshold` : fracción de episodios que deben coincidir (0.6 = 60%).
- `--minsec` : duración mínima (s) para considerar intro.

## Qué hace por dentro
1. Lee el HTML y extrae `seriesId` + la playlist (`window.playlist`).
2. Toma una muestra de la temporada.
3. Para cada episodio extrae **solo el audio** de los primeros `--window`
   segundos (ffmpeg con `-ss -t -vn` → lectura por rangos, **no** descarga
   el episodio completo).
4. Calcula una huella de audio por segundo (FFT → energía por bandas →
   código por dirección de cambio).
5. Busca por **consenso** el segmento repetido entre episodios = la intro.
6. Imprime `start`/`end` + un informe de verificación y guarda
   `out/<seriesId>.s<season>.json`.

## Estado actual (piloto The Big Bang Theory)

La infraestructura completa está hecha y funciona:

- **Extracción por rangos**: `extract.mjs` descarga SOLO el audio de los primeros
  `--window` segundos con ffmpeg (`-ss -t -vn`), sin descargar el episodio completo
  (los archivos de TBBT pesan ~535 MB cada uno; solo se leen los tramos necesarios).
- **Huella espectral** (`lib/fingerprint.mjs`) y **comparación** (`lib/match.mjs`).
- **Correlación cruzada normalizada** sobre el PCM real (`introspect.mjs`) como
  prueba directa de "es el mismo audio".

### Hallazgo técnico importante
En la muestra analizada (T1 E1–E4) **el audio no es idéntico entre episodios** ni
siquiera en la intro: las pistas están masterizadas/encodeadas de forma distinta,
por lo que:
- la correlación de forma de onda (NCC) es ~0 en todo el rango, y
- la similitud espectral por coseno "matchea" casi todo (no distingue la intro de
  los episodios, que comparten banda de risa / colchón musical).

Para una detección **fiable y universal** hace falta una huella perceptual
invariante al códec/EC/cambios de nivel, del tipo **chromaprint** (la misma que usa
Plex/Jellyfin/Subsonic). Con el método actual NO puedo confirmar los tiempos reales
de intro, así que NO he volcado ningún valor en `intro-database.js` (no inventar
tiempos).

### Próximo paso recomendado
Instalar un generador de huellas audio perceptual (chromaprint):
```bash
# Opción A (Windows, sin admin): bajar fpcalc de AcoustID
#   https://acoustid.org/chromaprint  → binario fpcalc.exe, ponerlo en el PATH
# Opción B: pip install pyacoustid  (requiere Python + libchromaprint)
```
Después, el detector usa `fpcalc`/`chromaprint` para comparar episodios con
tolerancia a las diferencias de códec, y se vuelcan los `start`/`end` confirmados
a `www/js/intro-database.js`.

## Después de validar el resultado
Copia el `{ start, end }` detectado a `www/js/intro-database.js`:

```js
window.introDatabase = {
  "<seriesId>": {
    "<indiceTemporada>": { "start": X, "end": Y, "source": "auto: ..." }
  }
};
```

El reproductor aplica esta prioridad:
1. intro manual válida del episodio (`episode.intro`) → manda.
2. intro automática de `introDatabase` → se usa si no hay manual válida.
3. si nada → botón "Saltar intro" oculto.

