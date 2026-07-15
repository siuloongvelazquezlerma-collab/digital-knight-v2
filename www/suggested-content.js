console.log("🎬 suggested-content.js cargado");

let suggestionOverlay = null;

function createSuggestionOverlay() {

    if (document.getElementById("suggestionOverlay")) return;

    suggestionOverlay = document.createElement("div");

    suggestionOverlay.id = "suggestionOverlay";

   suggestionOverlay.innerHTML = `

<div id="suggestionBackground"></div>

<video
 id="suggestionVideo"
 playsinline
 preload="auto">
</video>


<div id="suggestionLabel"></div>


<div id="suggestionSkip">
    Omitir en 10
</div>


<div id="suggestionProgress">
    <div id="suggestionProgressFill"></div>
</div>

`;

    document.body.appendChild(suggestionOverlay);

    const style = document.createElement("style");

    style.textContent = `

#suggestionOverlay{

position:fixed;
inset:0;

display:none;

background:black;

z-index:999999;

overflow:hidden;

}

#suggestionBackground{

position:absolute;

inset:0;

background-size:cover;

background-position:center;

background-repeat:no-repeat;

z-index:0;

filter:brightness(.35);

}


#suggestionVideo{

position:relative;

z-index:1;

width:100%;
height:100%;

object-fit:contain;

background:transparent;

}

#suggestionSkip{

position:absolute;

top:25px;
right:25px;

padding:10px 18px;

background:rgba(0,0,0,.7);

color:white;

font-size:18px;

border-radius:40px;

cursor:pointer;

user-select:none;

}

#suggestionProgress{

position:absolute;

left:0;
right:0;
bottom:0;

height:5px;

background:#444;

}

#suggestionProgressFill{

width:0%;

height:100%;

background:#e50914;

}

#suggestionSkip{

background:#e50914;

color:white;

border:none;

padding:12px 22px;

border-radius:999px;

font-size:16px;

cursor:pointer;

}

#suggestionLabel{

position:absolute;

top:25px;
left:25px;

color:white;

font-size:20px;

font-weight:bold;

background:rgba(0,0,0,.5);

padding:8px 15px;

border-radius:20px;

}

`;

    document.head.appendChild(style);

}



window.suggestionShown = window.suggestionShown || false;

window.showSuggestedContent = async function () {

    console.log("🔥 showSuggestedContent llamado");

    if (window.suggestionShown) {
    console.log("⛔ sugerencia ya mostrada");
    return;
}

window.suggestionShown = true;

    createSuggestionOverlay();

    console.log("Overlay:", document.getElementById("suggestionOverlay"));
console.log("Video:", document.getElementById("suggestionVideo"));

    const availableSuggestions =
    window.suggestionsLibrary.filter(x => x.active);


const item =
    availableSuggestions[
        Math.floor(Math.random() * availableSuggestions.length)
    ];


if (!item) return;


const background =
document.getElementById("suggestionBackground");

if(background && item.poster){

    background.style.backgroundImage =
    `url("${item.poster}")`;

}

    document.getElementById("suggestionLabel").textContent =
    "⭐ " + item.label;

    if (!item) return;
    const video = document.getElementById("suggestionVideo");

video.src = item.video;
video.load();

const progressFill =
document.getElementById("suggestionProgressFill");

video.ontimeupdate = ()=>{

    const percent =
        video.currentTime/video.duration*100;

    progressFill.style.width =
        percent+"%";

};

    document.getElementById("suggestionPoster").src = item.poster;


    suggestionOverlay.style.display = "flex";

    // 📱 Android: poner horizontal
if (window.Android) {
    Android.setLandscape();
}

// 🖥️ Web: fullscreen
setTimeout(() => {

    if (suggestionOverlay.requestFullscreen) {
        suggestionOverlay.requestFullscreen();
    } 
    else if (suggestionOverlay.webkitRequestFullscreen) {
        suggestionOverlay.webkitRequestFullscreen();
    }

}, 300);

    const skipButton = document.getElementById("suggestionSkip");

let seconds = item.skipAfter || 10;

skipButton.textContent = `Omitir en ${seconds}`;
skipButton.style.pointerEvents = "none";

const countdown = setInterval(() => {

    seconds--;

    if (seconds > 0) {

        skipButton.textContent = `Omitir en ${seconds}`;

    } else {

        clearInterval(countdown);

        skipButton.textContent = "Omitir";

        skipButton.style.pointerEvents = "auto";

    }

}, 1000);



    video.play().then(()=>{

    console.log("▶️ Trailer iniciado");

}).catch(err=>{

    console.warn("No se pudo reproducir el trailer:",err);

});

    return new Promise(resolve => {

    skipButton.onclick = () => {

    clearInterval(countdown);

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("src");
    video.load();

    suggestionOverlay.style.display = "none";
    suggestionOverlay.style.pointerEvents = "none";

    window.changingFromSuggestion = true;

    if (document.fullscreenElement) {
        document.exitFullscreen()
            .catch(() => {})
            .finally(() => resolve());
    } else {
        resolve();
    }
};

});

};

window.hideSuggestedContent = function(){

    const overlay = document.getElementById("suggestionOverlay");

    if(overlay){
        overlay.style.display = "none";
        overlay.removeAttribute("data-playing");
    }

};