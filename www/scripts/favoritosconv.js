const TMDB_API_KEY = "4b77886f6f12c73066c0d0509038df60";

async function convertirFavoritoADatos() {
  const favoritoData = document.getElementById("favoritoData");
  if (!favoritoData) return null;

  // --- Datos que ya tienes en tu HTML ---
  const poster = favoritoData.querySelector("#favoritoImagen")?.src || "";
  const title = favoritoData.querySelector("#nombre")?.textContent.trim() || "";
  const link = favoritoData.querySelector("#favoritoEnlace")?.getAttribute("href") || "";

  // --- Buscar en TMDB ---
  const query = encodeURIComponent(title);
  const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${query}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results || searchData.results.length === 0) {
    console.warn("⚠️ No se encontró en TMDB:", title);
    return {
      poster,
      title,
      hiddenTitles: [title, title.toLowerCase()],
      details: "N/A",
      link: link.startsWith("peliculas/") ? link : "peliculas/" + link
    };
  }

  const item = searchData.results[0];
  const id = item.id;
  const mediaType = item.media_type; // "movie" o "tv"

  // --- Obtener detalles desde TMDB ---
  const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=release_dates,content_ratings`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  // Año
  const year = mediaType === "movie"
    ? (detailsData.release_date ? detailsData.release_date.slice(0, 4) : "")
    : (detailsData.first_air_date ? detailsData.first_air_date.slice(0, 4) : "");

  // Clasificación de edad (intentamos primero con México, si no hay usamos US)
  let rating = "NR"; // Not Rated
  if (mediaType === "movie" && detailsData.release_dates) {
    const mxRelease = detailsData.release_dates.results.find(r => r.iso_3166_1 === "MX");
    const usRelease = detailsData.release_dates.results.find(r => r.iso_3166_1 === "US");
    const release = mxRelease || usRelease;
    if (release && release.release_dates[0]?.certification) {
      rating = release.release_dates[0].certification + "+";
    }
  } else if (mediaType === "tv" && detailsData.content_ratings) {
    const mxRating = detailsData.content_ratings.results.find(r => r.iso_3166_1 === "MX");
    const usRating = detailsData.content_ratings.results.find(r => r.iso_3166_1 === "US");
    const ratingData = mxRating || usRating;
    if (ratingData?.rating) {
      rating = ratingData.rating + "+";
    }
  }

  const details = `${rating} ${year}`;

  // --- Hidden titles (para búsqueda) ---
  const hiddenTitles = [
    title,
    title.toLowerCase(),
    detailsData.original_title || detailsData.original_name || "",
    ...(detailsData.alternative_titles?.titles?.map(t => t.title) || [])
  ].filter(Boolean);

  // --- JSON final ---
  return {
    poster,
    title,
    hiddenTitles,
    details,
    link: link.startsWith("peliculas/") ? link : "peliculas/" + link
  };
}

// Ejemplo de uso:
convertirFavoritoADatos().then(datos => {
  console.log(JSON.stringify(datos, null, 2));
});