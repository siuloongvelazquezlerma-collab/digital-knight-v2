
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("a[download]").forEach(link => {

    link.addEventListener("click", function(e) {

      if (typeof Android === "undefined") return;

      e.preventDefault(); // 🚫 cancela descarga normal

      const url = this.href;

      // 🔥 INTENTA SACAR EL TÍTULO
      let titulo =
        document.getElementById("nombre")?.textContent ||
        this.getAttribute("download") ||
        "Video";

      // 🔥 IMAGEN (PELÍCULAS)
      let imagen =
        document.getElementById("favoritoImagen")?.src || "";

      // 🔥 SI ES SERIE → intenta detectar thumbnail dinámico
      if (!imagen) {
        const thumb = document.querySelector("img[src*='tmdb']");
        if (thumb) imagen = thumb.src;
      }

      // 🚀 ENVÍA A ANDROID
      Android.downloadFile(url, titulo, imagen);

    });

  });

});
