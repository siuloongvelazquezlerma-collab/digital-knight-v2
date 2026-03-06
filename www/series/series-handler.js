// 🌍 Función para obtener el nombre de la serie desde el URL o el archivo actual
function getSeriesName() {
    var pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 2] || "default_series";
}

// 🎬 Función para actualizar la barra de progreso
function updateProgressBar(episodeAlt, progress) {
    var seriesName = getSeriesName();
    localStorage.setItem(`${seriesName}_progress_${episodeAlt}`, progress);
    console.log(`Actualizando progreso de ${seriesName} - ${episodeAlt} a ${progress}%`);
}

// 🎥 Función para actualizar el botón de reproducción
function updatePlayButton() {
    var seriesName = getSeriesName();
    var lastEpisodeAlt = localStorage.getItem(`${seriesName}_lastPlayedEpisode`);
    if (lastEpisodeAlt) {
        var started = localStorage.getItem(`${seriesName}_started_${lastEpisodeAlt}`);
        var text = (started === "true") ? `Continuar ${lastEpisodeAlt}` : `Mira ${lastEpisodeAlt}`;
        var playButton = document.querySelector(".play-button");
        playButton.innerHTML = `<span class="material-icons">play_arrow</span> ${text}`;

        var episodeDiv = document.querySelector(`.episode img[alt='${lastEpisodeAlt}']`)?.closest(".episode");
        if (episodeDiv) {
            var onclickAttr = episodeDiv.getAttribute("onclick");
            var match = onclickAttr ? onclickAttr.match(/playEpisode\('([^']+)'\)/) : null;
            var videoSrc = match ? match[1] : null;

            if (videoSrc) {
                playButton.setAttribute("onclick", `playEpisode('${videoSrc}', '${lastEpisodeAlt}')`);
            }
        }
    }
}

// 📌 Función para reproducir episodios
function playEpisode(videoSrc, episodeAlt) {
    var seriesName = getSeriesName();
    videoPlayer.src({ type: "video/mp4", src: videoSrc });
    videoPlayer.play();
    localStorage.setItem(`${seriesName}_lastPlayedEpisode`, episodeAlt);
    localStorage.setItem(`${seriesName}_started_${episodeAlt}`, "true");
    updateProgressBar(episodeAlt, 0);
}

// 📌 Actualizar eventos de clic en episodios
document.querySelectorAll(".episode").forEach(episode => {
    episode.addEventListener("click", function () {
        var onclickAttr = this.getAttribute("onclick");
        var match = onclickAttr ? onclickAttr.match(/playEpisode\('([^']+)'\)/) : null;
        var videoSrc = match ? match[1] : null;
        var episodeAlt = this.querySelector("img").alt;
        if (videoSrc && episodeAlt) playEpisode(videoSrc, episodeAlt);
    });
});

// 📌 Restaurar progreso al cargar
window.onload = function () {
    var seriesName = getSeriesName();
    var lastEpisodeAlt = localStorage.getItem(`${seriesName}_lastPlayedEpisode`);

    if (lastEpisodeAlt) {
        var lastEpisode = document.querySelector(`.episode img[alt='${lastEpisodeAlt}']`);
        if (lastEpisode) {
            updatePlayButton();
        }
    }

    document.querySelectorAll(".episode").forEach(episode => {
        var episodeAlt = episode.querySelector("img").alt;
        var progressBar = episode.querySelector(".progress");
        var savedProgress = parseFloat(localStorage.getItem(`${seriesName}_progress_${episodeAlt}`)) || 0;
        if (progressBar) {
            progressBar.style.width = savedProgress + "%";
        }
    });
};
