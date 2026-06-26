
// ====== Control desde Android PiP ======

window.pipPlay = function () {
    if (video.paused) {
      video.play();
      playPauseBtn.textContent = 'pause';
    }
  };
  
  window.pipPause = function () {
    if (!video.paused) {
      video.pause();
      playPauseBtn.textContent = 'play_arrow';
    }
  };
  
  window.pipForward = function () {
    video.currentTime = Math.min(
      video.currentTime + 10,
      video.duration || video.currentTime
    );
  };
  
  window.pipRewind = function () {
    video.currentTime = Math.max(
      video.currentTime - 10,
      0
    );
  };