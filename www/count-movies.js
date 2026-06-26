const fs = require("fs");
const path = require("path");

// Leer movies.json
const dataPath = path.join(__dirname, "movies.json");
const movies = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Contadores
const folderCount = {};
let totalPeliculas = 0;
let totalSeries = 0;
let totalAnime = 0;

// Recorrer todas las entradas
movies.forEach(item => {
  if (!item.link) return;

  // Obtener la carpeta (antes del /)
  const folder = item.link.split("/")[0];

  // Contar por carpeta
  folderCount[folder] = (folderCount[folder] || 0) + 1;

  const folderLower = folder.toLowerCase();

  // Clasificación general
  if (folderLower === "series") {
    totalSeries++;
  } else if (folderLower === "anime" || folderLower === "animacion") {
    totalAnime++;
  } else {
    totalPeliculas++;
  }
});

// Mostrar resultados
console.log("\n📂 CONTENIDO POR CARPETA\n");

let totalGeneral = 0;
Object.keys(folderCount)
  .sort()
  .forEach(folder => {
    console.log(`📁 ${folder}: ${folderCount[folder]}`);
    totalGeneral += folderCount[folder];
  });

console.log("\n📊 RESUMEN GENERAL\n");
console.log(`🎞️ Películas: ${totalPeliculas}`);
console.log(`📺 Series: ${totalSeries}`);
console.log(`🍥 Anime / Animación: ${totalAnime}`);
console.log(`\n🔥 TOTAL GENERAL: ${totalGeneral}\n`);
