'use strict';

/* ==========================================
   DIGITAL KNIGHT PLAYER
========================================== */

const params = new URLSearchParams(location.search);

const movieId = params.get("movie");
const seriesId = params.get("series");
const episodeId = params.get("episode");
const trailerId = params.get("trailer");

const IS_MOVIE = !!movieId;
const IS_SERIES = !!seriesId;
const IS_TRAILER = !!trailerId;

/* ==========================================
   ELEMENTOS
========================================== */

const player=document.getElementById("player");

const videoElement=document.getElementById("video");

const video=videoElement.tagName==="VIDEO"
?videoElement
:document.getElementById("video_html5_api");

const source=document.getElementById("videoSource");

const controls=document.getElementById("controls");

const overlay=document.getElementById("overlay");

const overlayTop=document.getElementById("overlayTop");

const overlayBottom=document.getElementById("overlayBottom");

const progress=document.getElementById("progress");

const duration=document.getElementById("duration");

const loader=document.getElementById("videoLoader");

const playPauseBtn=document.querySelector("#playPauseBtn .material-icons");

const playerTitle=document.getElementById("playerTitle");

const subtitle=document.getElementById("episodeSubtitle");

const restartButton=document.getElementById("restartButton");

const nextButton=document.getElementById("nextButton");

const backButton=document.getElementById("backButton");

const castButton=document.getElementById("castButton");

const aspectButton=document.getElementById("aspectButton");

const audioButton=document.getElementById("audioButton");

const subtitleButton=document.getElementById("subtitleButton");

const langMenu=document.getElementById("langMenu");

const skipIntroBtn=document.getElementById("skipIntroBtn");

const nextEpisodeBtn=document.getElementById("nextEpisodeBtn");

const circleProgress=document.getElementById("circleProgress");

const aspectLabel=document.getElementById("aspectLabel");

/* ==========================================
   ESTADO
========================================== */

let playerInstance=null;

let controlsVisible=true;

let controlsTimer=null;

let currentAspect="contain";

let introSkipped=false;

let nextEpisodeTimer=null;

let buffering=false;

/* ==========================================
   VIDEOJS
========================================== */

playerInstance=videojs(video,{
controls:false,
autoplay:false,
preload:"auto",
fluid:false
});

/* ==========================================
   CARGAR VIDEO
========================================== */

async function loadPlayer(){

loader.classList.remove("hidden");

try{

await loadMetadata();

source.src=currentMovie.video;

playerTitle.textContent=currentMovie.title;

subtitle.textContent=currentMovie.subtitle||"";

video.load();

}
catch(e){

console.error(e);

}

}

document.addEventListener("DOMContentLoaded",loadPlayer);

/* ==========================================
   PLAY
========================================== */

function playVideo(){

video.play();

playPauseBtn.textContent="pause";

showControls();

}

/* ==========================================
   PAUSE
========================================== */

function pauseVideo(){

video.pause();

playPauseBtn.textContent="play_arrow";

showControls();

}

/* ==========================================
   TOGGLE
========================================== */

function togglePlay(){

if(video.paused){

playVideo();

}else{

pauseVideo();

}

}

/* ==========================================
   SKIP
========================================== */

function skip(seconds){

video.currentTime+=seconds;

}

/* ==========================================
   BOTONES
========================================== */

document.getElementById("playPauseBtn").onclick=togglePlay;

document.getElementById("rewind10").onclick=()=>skip(-10);

document.getElementById("forward10").onclick=()=>skip(10);

backButton.onclick=goBack;

restartButton.onclick=restartVideo;

nextButton.onclick=playNextEpisode;

/* ==========================================
   ABRIR PLAYER
========================================== */

function showPlayer(){

    player.style.display="flex";

    if(window.Android){
        Android.setLandscape();
    }

    enterFullscreen();

    playVideo();

}

/* ==========================================
   CERRAR PLAYER
========================================== */

function goBack(){

    exitFullscreen();

    if(window.Android){
        Android.setPortrait();
    }

    pauseVideo();

    player.style.display="none";

}

/* ==========================================
   FULLSCREEN
========================================== */

function enterFullscreen(){

    if(document.fullscreenElement) return;

    try{

        if(player.requestFullscreen){

            player.requestFullscreen();

        }else if(player.webkitRequestFullscreen){

            player.webkitRequestFullscreen();

        }else if(player.msRequestFullscreen){

            player.msRequestFullscreen();

        }

    }catch(e){

        console.warn(e);

    }

}

function exitFullscreen(){

    try{

        if(document.exitFullscreen){

            document.exitFullscreen();

        }else if(document.webkitExitFullscreen){

            document.webkitExitFullscreen();

        }else if(document.msExitFullscreen){

            document.msExitFullscreen();

        }

    }catch(e){

        console.warn(e);

    }

}

/* ==========================================
   FULLSCREEN CHANGE
========================================== */

document.addEventListener("fullscreenchange",()=>{

    if(document.fullscreenElement) return;

    pauseVideo();

    player.style.display="none";

    if(window.Android){

        Android.setPortrait();

    }

});

/* ==========================================
   PLAYER EVENTS
========================================== */

player.addEventListener("mousemove",showControls);

player.addEventListener("click",showControls);

player.addEventListener("touchstart",showControls,{
passive:true
});

/* ==========================================
   CONTROLES
========================================== */

function showControls(){

    controls.classList.remove("hidden");
    controls.classList.add("visible");

    overlay.classList.add("visible");
    overlayTop.classList.add("visible");
    overlayBottom.classList.add("visible");

    controlsVisible=true;

    clearTimeout(controlsTimer);

    controlsTimer=setTimeout(()=>{

        if(!video.paused){

            hideControls();

        }

    },5000);

}

function hideControls(){

    controls.classList.remove("visible");
    controls.classList.add("hidden");

    overlay.classList.remove("visible");
    overlayTop.classList.remove("visible");
    overlayBottom.classList.remove("visible");

    controlsVisible=false;

}

function toggleControls(){

    if(controlsVisible){

        hideControls();

    }else{

        showControls();

    }

}

/* ==========================================
   PROGRESO
========================================== */

video.addEventListener("play",showControls);

video.addEventListener("pause",showControls);

video.addEventListener("ended",showControls);

/* ==========================================
   TOUCH
========================================== */

const isTouchDevice=
'ontouchstart' in window||
navigator.maxTouchPoints>0;

if(isTouchDevice){

let lastTouch=0;

video.addEventListener("touchstart",(e)=>{

    if(e.touches.length>1)return;

    e.preventDefault();
    e.stopPropagation();

    lastTouch=Date.now();

    toggleControls();

},{passive:false});

video.addEventListener("click",(e)=>{

    if(Date.now()-lastTouch<500){

        e.preventDefault();
        e.stopPropagation();

    }

},true);

}else{

video.addEventListener("mousemove",()=>{

    showControls();

    enableCursorAutoHide();

});

}

/* ==========================================
   CURSOR PC
========================================== */

let mouseTimer;

function enableCursorAutoHide(){

    document.body.style.cursor="default";

    clearTimeout(mouseTimer);

    mouseTimer=setTimeout(()=>{

        if(!video.paused){

            document.body.style.cursor="none";

        }

    },3000);

}

video.addEventListener("pause",()=>{

    document.body.style.cursor="default";

    clearTimeout(mouseTimer);

});

video.addEventListener("play",enableCursorAutoHide);

/* ==========================================
   PROGRESO
========================================== */

function updateProgress(){

    if(!video.duration)return;

    const percent=(video.currentTime/video.duration)*100;

    progress.value=percent;

    progress.style.background=
    `linear-gradient(to right,#fff ${percent}%,#666 ${percent}%)`;

    const remain=video.duration-video.currentTime;

    const h=Math.floor(remain/3600);

    const m=Math.floor((remain%3600)/60);

    const s=Math.floor(remain%60);

    duration.textContent=
    h>0
    ?`- ${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    :`- ${m}:${String(s).padStart(2,"0")}`;

}

video.addEventListener("timeupdate",updateProgress);

progress.addEventListener("input",()=>{

    if(video.duration){

        video.currentTime=
        (progress.value/100)*video.duration;

    }

});

/* ==========================================
   BUFFER
========================================== */

video.addEventListener("progress",()=>{

    if(!video.duration)return;

    const buffered=video.buffered;

    if(!buffered.length)return;

    const end=buffered.end(buffered.length-1);

    const percent=(end/video.duration)*100;

    progress.style.setProperty("--buffer-width",percent+"%");

});