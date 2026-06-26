const express = require("express");
const JSZip = require("jszip");
const fetch = require("node-fetch");
const app = express();
const PORT = 3000;

// Para poder recibir JSON desde el frontend
app.use(express.json({ limit: "50mb" }));

// Ruta para crear ZIP de una temporada
app.post("/download-season", async (req, res) => {
  try {
    const { seriesTitle, seasonIndex, playlistData } = req.body;
    const season = playlistData.seasons[seasonIndex];
    const episodes = season.episodes;

    const zip = new JSZip();

    for (let ep of episodes) {
      try {
        const response = await fetch(ep.source);
        const buffer = await response.arrayBuffer();
        const fileName = `${seriesTitle} - ${season.season} - Ep${ep.number} - ${ep.title}.mp4`;
        zip.file(fileName, Buffer.from(buffer));
        console.log(`Agregado: ${fileName}`);
      } catch (err) {
        console.error("Error al descargar episodio:", ep.number, err);
      }
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${seriesTitle} - ${season.season}.zip"`,
      "Content-Length": zipContent.length,
    });

    res.send(zipContent);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al generar ZIP");
  }
});

app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
