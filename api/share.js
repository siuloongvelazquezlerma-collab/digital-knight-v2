export default async function handler(req, res) {
  try {
    let { link } = req.query;

    if (!link) {
      return res.status(400).send("Falta link");
    }

    // 🔥 limpiar link
    link = link.replace(/^\/+/, "");

    let url = `https://digital-knight-v2.vercel.app/${link}`;

    // 🔥 detectar carpeta automática
    if (!link.includes("/")) {
      const posibles = [
        `peliculas/${link}`,
        `series/${link}`,
        `Anime/${link}`,
        `disney/${link}`
      ];

      for (const ruta of posibles) {
        const testUrl = `https://digital-knight-v2.vercel.app/${ruta}`;

        try {
          const resTest = await fetch(testUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          if (resTest.status === 200) {
            url = testUrl;
            break;
          }
        } catch (e) {}
      }
    }

    // 🔥 obtener HTML
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();

    // 🔥 extraer datos
    const titleMatch = html.match(/id="nombre"[^>]*>([^<]+)</i);
    const imageMatch = html.match(/id="favoritoImagen"[^>]*src="([^"]+)"/i);

    const title = titleMatch ? titleMatch[1].trim() : "Digital Knight";
    let image = imageMatch ? imageMatch[1] : "";

    // 🔥 asegurar imagen absoluta
    if (image && !image.startsWith("http")) {
      image = `https://digital-knight-v2.vercel.app/${image}`;
    }

    const description = `Mira "${title}" en Digital Knight`;

    res.setHeader("Content-Type", "text/html");

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />

        <!-- 🔥 OPEN GRAPH -->
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content="${url}" />

        <!-- 🔥 TWITTER -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />

        <title>${title}</title>

        <!-- 🔥 SCRIPT INTELIGENTE -->
      <script>

const webUrl = "${url}";

const esAndroid = /Android/i.test(navigator.userAgent);

if (esAndroid) {

    const intentUrl =
        "intent://" +
        webUrl.replace("https://", "") +
        "#Intent;scheme=https;package=com.digitalknight.app;" +
        "S.browser_fallback_url=https%3A%2F%2Fdigital-knight-download-app.gt.tc%2F%3Fi%3D1;" +
        "end";

    location.href = intentUrl;

} else {

    // PC, Mac, Linux, etc.
    location.href = webUrl;

}

</script>

      </head>
      <body>
        Redirigiendo...
      </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Error interno");
  }
}